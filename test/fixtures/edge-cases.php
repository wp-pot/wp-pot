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
someFunction( __( 'Translation in function call', 'testdomain' ) );
echo __( 'Echoed translation', 'testdomain' );
if  (1 === 1 ): ?>
	<? _e( 'Method in if block', 'testdomain' ); ?>
<?php endif;
return __( 'Returned function', 'testdomain' );

exit( __('Exit message', 'testdomain') );
die( __('Exit message', 'testdomain') );

try{ $a = esc_html__("Text within try", "testdomain"); } catch ( Exception $e) { $b = esc_html__("Text within catch", "testdomain"); }

\_e('With root namespace', 'testdomain');

__($object->ignoreThis, 'testdomain');
_n('Ignore when argument is variable', $object->ignoreThis, 1, 'testdomain');

_($ignoreThis, 'testdomain');
_n('Ignore when argument is variable', $ignoreThis, 1, 'testdomain');
