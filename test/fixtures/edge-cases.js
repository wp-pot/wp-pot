var count = 0, test = 0, obj = { test: 0 }, TEST = 0, ignoreThis = 0, bool_flag = false;
__( "It's escaped", 'testdomain' );
__( 'It\'s escaped', 'testdomain' );
__( 'This is "escaped"', 'testdomain' );
__( "This is \"escaped\"", 'testdomain' );
__( ( `New
Line`), 'testdomain' );
__( "New\nLine", 'testdomain' );
__(
	'Hello World',
	'testdomain'
);
_n('Singular string', 'Plural string', count, 'testdomain');
_n('Singular string', 'Plural string', 1+1, 'testdomain');
_n('Singular string', 'Plural string', 1 + 1, 'testdomain');
_e( 'Domain is a variable', test );
_e( 'Domain is a object variable', this.test );
// _e( 'Domain is a static class variable', this::test );
_e( 'Domain is a constant', TEST );
_e( 'Missing domain' );
someFunction('this', 'is', 'a', 'random', 'function' );
someFunction( __( 'Translation in function call', 'testdomain' ) );
console.log(__( 'Echoed translation', 'testdomain' ));
if (1 === 1 ) {
	_e( 'Method in if block', 'testdomain' );
} else if (2 === 2 ) {
	_e( 'Method in elseif block', 'testdomain' );
}
function ret () { return __( 'Returned function', 'testdomain' ); }

exit( __('Exit message', 'testdomain') );
die( __('Exit message', 'testdomain') );

try{ var a = esc_html__("Text within try", "testdomain"); } catch (e) { var b = esc_html__("Text within catch", "testdomain"); }

_e('With root namespace', 'testdomain');

__(obj.ignoreThis, 'testdomain');
_n('Ignore when argument is variable', obj.ignoreThis, 1, 'testdomain');

_(ignoreThis, 'testdomain');
_n('Ignore when argument is variable', ignoreThis, 1, 'testdomain');

wc_print_notice( apply_filters( 'woocommerce_checkout_coupon_message', esc_html__( 'Concat functions with .', 'testdomain' ) + ' <a href="#" class="showcoupon">' + esc_html__( 'Concat functions with . again', 'testdomain' ) + '</a>' ), 'notice' );

var a = (new ClassName(__('Text in new class parameter', 'testdomain'))).function();

echo ( bool_flag ) ? esc_html__( 'Text in true ternary statements', 'testdomain' ) : '';
echo ( bool_flag ) ? '' : esc_html__( 'Text in false ternary statements', 'testdomain' );

var name = __( 'Translation is in an array key', 'testdomain' )
obj[name] = 'Value';
__( '', 'testdomain' );
