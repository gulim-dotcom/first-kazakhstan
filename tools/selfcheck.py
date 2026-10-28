#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Самопроверка tools/update_data.py без сети: ловит ошибку в коде обновления до того, как она попадёт на сайт.

Запуск у себя:  python tools/selfcheck.py   (нужен только Python 3 — ни openpyxl, ни интернет не требуются).
В Actions выполняется для каждого pull request и каждой правки main (.github/workflows/check.yml) вместе с pyflakes
(опечатки, неопределённые имена) и сборкой сайта. Красная галочка у pull request — объединять нельзя, пока не исправлено.

Что проверяется:
- main() целиком, на копии assets/data/ во временной папке: таблица, формы, Connect и Telegram подменены данными из
  репозитория, поэтому сеть не нужна. Ветки: в Connect появилось событие -> sheet.js переписан, отметка «Обновлено» новая;
  ничего не изменилось (быстрый запуск FK_QUICK=1) -> файлы не тронуты, формы заново не открываются; Connect недоступен ->
  прежний список остаётся, статус ok; таблица недоступна -> sheet.js не тронут, статус «error», код выхода 1.
- разбор списка событий Connect (parse_connect) и проверки адресов (is_form_url, host_ok, link_ok).
Файлы репозитория скрипт не меняет. Любой провал — сообщение «ПРОВАЛ: …» и код выхода 1.
"""
import json, os, shutil, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import update_data as u   # noqa: E402  (сам импорт — уже проверка: синтаксическая ошибка не пройдёт)


def check(cond, msg):
    if not cond:
        sys.exit('ПРОВАЛ: ' + msg)


def read(name):
    return open(os.path.join(u.DATA, name), encoding='utf-8').read()


def copy_of(obj):
    return json.loads(json.dumps(obj))


def pure_functions():
    page = ('<a href="/events/iqanat-first-regional-2026">1</a> '
            '<a href="https://connect.ustem.kz/events/astana-first-scrimmage-2026-k-e-r-n-school/">2</a> '
            '<a href="/events/iqanat-first-regional-2026">1 ещё раз</a> '
            '<a href="/events?open=1&amp;page=2">стр. 2</a> <a href="/events/">список</a> <a href="/events/x">коротко</a>')
    slugs, pages = u.parse_connect(page)
    check(slugs == ['iqanat-first-regional-2026', 'astana-first-scrimmage-2026-k-e-r-n-school'] and pages == {2},
          'parse_connect: %r, страницы %r' % (slugs, pages))
    check(u.is_form_url('https://forms.gle/abc') and u.is_form_url('https://docs.google.com/forms/d/e/1/viewform')
          and not u.is_form_url('http://forms.gle/abc') and not u.is_form_url('https://docs.google.com/spreadsheets/d/1/edit'), 'is_form_url')
    check(u.host_ok(u.CONNECT_LIST) and u.host_ok('https://t.me/s/firstroboticskz')
          and not u.host_ok('https://example.com/') and not u.host_ok('http://' + u.CONNECT_HOST + '/'), 'host_ok')
    check(u.link_ok('https://www.firstinspires.org/x') and u.link_ok('https://ustem.kz/')
          and not u.link_ok('https://firstinspires.org.example.com/'), 'link_ok')
    check(u.almaty_day('2026-10-27T20:15:00Z') == '2026-10-28' and u.almaty_day('') == '', 'almaty_day')


def dry_run():
    """main() на копии данных: все внешние источники подменены."""
    src = u.DATA
    tmp = tempfile.mkdtemp(prefix='fk-selfcheck-')
    try:
        for f in os.listdir(src):
            if f.endswith('.js'):
                shutil.copy(os.path.join(src, f), tmp)
        u.DATA = tmp
        os.environ.pop('FK_QUICK', None)
        prev = u.read_js('sheet.js', 'FK_SHEET')
        check(bool(prev and prev.get('tabs') and prev.get('forms') is not None), 'assets/data/sheet.js: нет снимка таблицы — не с чем проверять')
        connect0 = prev.get('connect') or []
        new_ev = 'https://%s/events/selfcheck-first-regional-2099' % u.CONNECT_HOST
        calls = []
        u.fetch_sheet = lambda sheet_id: copy_of(prev['tabs'])
        u.check_forms = lambda tabs, prev_forms: (calls.append('forms'), copy_of(prev['forms']))[1]
        u.fetch_connect = lambda prev_list: sorted(connect0 + [new_ev])
        u.update_site = lambda site_rows, news_rows, n, stamp: ''
        u.fetch_telegram = lambda channel, tags, prev_items, max_items: prev_items

        print('--- 1. полный запуск, в Connect появилось событие')
        rc = u.main()
        sh, st = u.read_js('sheet.js', 'FK_SHEET'), u.read_js('status.js', 'FK_STATUS')
        check(rc == 0 and st.get('sheet') == 'ok' and st.get('site') == 'ok' and st.get('telegram') == 'ok', '1: код %r, статус %r' % (rc, st))
        check(new_ev in sh['connect'] and len(sh['connect']) == len(connect0) + 1, '1: список Connect в sheet.js не обновился')
        check(sh['updated'] != prev['updated'] and sh['tabs'] == prev['tabs'] and sh['forms'] == prev['forms'], '1: отметка «Обновлено» или данные таблицы')
        check(calls == ['forms'], '1: при полном запуске формы должны проверяться один раз, вызовов: %r' % calls)

        print('--- 2. быстрый запуск, изменений нет')
        before = read('sheet.js')
        calls.clear()
        os.environ['FK_QUICK'] = '1'
        u.fetch_connect = lambda prev_list: list(sh['connect'])
        rc = u.main()
        check(rc == 0 and read('sheet.js') == before and not calls,
              '2: код %r, формы открывались: %r, sheet.js %s' % (rc, bool(calls), 'переписан' if read('sheet.js') != before else 'тот же'))
        os.environ.pop('FK_QUICK', None)

        print('--- 3. Connect недоступен')

        def down(prev_list):
            raise OSError('connect down')
        u.fetch_connect = down
        rc = u.main()
        st3 = u.read_js('status.js', 'FK_STATUS')
        check(rc == 0 and st3.get('sheet') == 'ok' and read('sheet.js') == before, '3: код %r, статус %r' % (rc, st3))

        print('--- 4. таблица недоступна')

        def no_sheet(sheet_id):
            raise RuntimeError('таблица не открылась как .xlsx')
        u.fetch_sheet = no_sheet
        u.fetch_connect = lambda prev_list: list(sh['connect'])
        rc = u.main()
        st4 = u.read_js('status.js', 'FK_STATUS')
        check(rc == 1 and (st4.get('sheet') or '').startswith('error: таблица не открылась') and read('sheet.js') == before,
              '4: код %r, статус %r' % (rc, st4))
    finally:
        u.DATA = src
        shutil.rmtree(tmp, ignore_errors=True)


def names():
    """pyflakes, если установлен (pip install pyflakes): неопределённые имена, опечатки, лишние импорты."""
    try:
        import pyflakes.api
    except ImportError:
        print('pyflakes не установлен (pip install pyflakes) — проверка имён пропущена, в Actions она выполняется')
        return
    n = pyflakes.api.checkPath(u.__file__) + pyflakes.api.checkPath(os.path.abspath(__file__))
    check(n == 0, 'pyflakes: замечаний %d (см. выше)' % n)


if __name__ == '__main__':
    pure_functions()
    dry_run()
    names()
    print('Самопроверка пройдена: update_data.py работает, файлы репозитория не тронуты.')
