<?php
/**
 * https://github.com/rasmusbe/wp-pot/issues/29#issuecomment-384191855
 */
?>

<p><?php
	/* translators: 1: current year, 2: site title link. */
	printf(
		_x( '&copy; %1$d %2$s', 'site copyright', 'testdomain' ),
		date( 'Y' ),
		'<a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html( get_bloginfo( 'name' ) ) . '</a>'
	);

?></p>