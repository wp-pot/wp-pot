<?php
__('Return string', 'testdomain');
_e('Print string', 'testdomain');
esc_attr__('Escape for attribute and return string', 'testdomain');
esc_attr_e('Escape for attribute and print string', 'testdomain');
esc_html__('Escape for html and return string', 'testdomain');
esc_html_e('Escape for html and print string', 'testdomain');
_x('Return string with context', 'Some context', 'testdomain');
_ex('Print string with context', 'Some context', 'testdomain');
esc_attr_x('Escape string with context for attribute', 'Some context', 'testdomain');
esc_html_x('Escape string with context for html', 'Some context', 'testdomain');
_n('Singular string', 'Plural string', 2, 'testdomain');
_n_noop('Singular string with noop', 'Plural string with noop', 'testdomain');
_nx('Singular string with context', 'Plural string with context', 2, 'Some context', 'testdomain');
_nx_noop('Singular string with noop and context', 'Plural string with noop and context', 'Some context', 'testdomain');
