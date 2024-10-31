<?php
/*
Author:			edward_plainview
Author Email:	info@plainviewplugins.com
Author URI:		https://plainviewplugins.com
Description:	Prevent comment spam by using Javascript.
Domain Path:	/lang
Plugin Name:	Plainview Comment Antispam
Plugin URI:		https://plainviewplugins.com/
Version:		1.02
*/

class Plainview_Comment_Antispam
{
	/**
		@brief		Constructor.
		@since		2018-08-31 06:36:10
	**/
	public function __construct()
	{
		add_action( 'comment_form', [ $this, 'comment_form' ] );
		add_filter( 'preprocess_comment', [ $this, 'preprocess_comment' ] );
		add_action( 'wp_ajax_plainview_comment_antispam_get_nonces', [ $this, 'ajax_get_nonces' ] );			// https
		add_action( 'wp_ajax_nopriv_plainview_comment_antispam_get_nonces', [ $this, 'ajax_get_nonces' ] );		// http
	}

	// --------------
	//		CALLBACKS
	// --------------

	/**
		@brief		Adds our hidden nonce to the comment form.
		@since		2018-08-31 06:36:10
	**/
	public function comment_form()
	{
		if ( ! $this->is_applicable() )
			return;
		echo sprintf( '<script type="text/javascript"> var plainview_comment_antispam_ajax_url = "%s"; </script>', admin_url( 'admin-ajax.php' ) );
		wp_enqueue_script( 'plainview_comment_antispam', plugin_dir_url( __FILE__ )  . 'plainview_comment_antispam.js', [ 'jquery' ] );
	}

	/**
		@brief		Check the comment form.
		@since		2018-08-31 06:36:10
	**/
	public function preprocess_comment( $commentdata )
	{
		if ( ! $this->is_applicable() )
			return $commentdata;

		// We must be posting.
		if ( count( $_POST ) < 1 )
			return $commentdata;

		$fail = false;
		if ( ! isset( $_GET[ $this->get_nonce_name() ] ) )
			$fail = true;

		if ( ! $fail )
			if ( $_GET[ $this->get_nonce_name() ] != $this->get_nonce_value() )
				$fail = true;

		// Allow other plugins to override the check.
		apply_filters( 'plainview_comment_antispam_check_commentdata', $fail, $commentdata );

		if ( $fail )
		{
			// Allow other plugins to do something when we detect spam.
			do_action( 'plainview_comment_antispam_comment_is_spam', $commentdata );
			wp_die( 'Please <strong>enable Javascript</strong> before commenting. This helps prevent comment spam.<br/><br/>Plainview Comment Antispam.' );
		}

		return $commentdata;
	}

	// --------------
	//		MISC
	// --------------

	/**
		@brief		Return the nonce data.
		@since		2018-08-31 06:36:10
	**/
	public function ajax_get_nonces()
	{
		$data = [
			'name' => $this->get_nonce_name(),
			'value' => $this->get_nonce_value(),
		];

		echo json_encode( $data );

		exit;
	}

	/**
		@brief		Return the nonce value.
		@since		2018-08-31 06:36:10
	**/
	public function get_nonce_value()
	{
		$r = md5( $_SERVER[ 'REMOTE_ADDR' ] . NONCE_SALT );
		$r = substr( $r, 0, 8 );
		return $r;
	}

	/**
		@brief		Get the nonce name.
		@since		2018-08-31 06:36:10
	**/
	public function get_nonce_name( $name = 'plainview_comment_antispam' )
	{
		$r = md5( $name . NONCE_SALT );
		$r = substr( $r, 0, 8 );
		return $r;
	}

	/**
		@brief		Is the protection applicable?
		@since		2018-08-31 06:56:43
	**/
	public function is_applicable()
	{
		// All logged-in users are allowed
		if ( get_current_user_id() > 0 )
			return false;

		return true;
	}
}
new Plainview_Comment_Antispam();
