<?php
__( "It's escaped", 'testdomain' );
__( 'It\'s escaped', 'testdomain' );
__( 'This is "escaped"', 'testdomain' );
__( "This is \"escaped\"", 'testdomain' );
__( ( "New
Line"), 'testdomain' );
__( "New\nLine", 'testdomain' );
__(
	'Hello World',
	'testdomain'
);
_n('Singular string', 'Plural string', $count, 'testdomain');
_n('Singular string', 'Plural string', 1+1, 'testdomain');
_n('Singular string', 'Plural string', 1 + 1, 'testdomain');
_e( 'Domain is a variable', $test );
_e( 'Domain is a object variable', $this->test );
_e( 'Domain is a static class variable', $this::test );
_e( 'Domain is a constant', TEST );
_e( 'Missing domain' );
someFunction('this', 'is', 'a', 'random', 'function' );
