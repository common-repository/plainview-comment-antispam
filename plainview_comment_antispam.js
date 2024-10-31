jQuery( document ).ready( function( $ )
{
	var plainview_comment_antispam = new function()
	{
		var pca = this;

		pca.$form = $( 'form#commentform' );

		pca.$author = $( '#author', pca.$form );
		pca.$comment = $( '#comment', pca.$form );

		/**
			@brief		The validity value of the comment.
			@since		2019-11-13 22:05:51
		**/
		pca.validity = {}
		pca.validity.total = 0;		// Total

		/**
			@brief		When the visitor clicked on an input.
			@since		2019-11-13 22:14:31
		**/
		pca.validity.focusing = {};
		pca.validity.focusing.author = 0;
		pca.validity.focusing.comment = 0;

		/**
			@brief		The minimum amount of validity required to accept the comment.
			@since		2019-11-13 22:06:16
		**/
		pca.validity_threshold = 2;

		/**
			@brief		Check the focusing for validity.
			@since		2019-11-13 22:27:44
		**/
		pca.check_focusing = function()
		{
			if ( pca.validity.focusing.author == 0 )
				return;
			if ( pca.validity.focusing.comment == 0 )
				return;
			var diff = Math.abs( pca.validity.focusing.author - pca.validity.focusing.comment );
			console.log( 'diff', diff );
			if ( diff < 1000 )		// milliseconds = 1 seconds
				return;

			if ( pca.validity.check_focusing > 0 )
				return;
			pca.validity.check_focusing = true;

			console.log( 'PSA: Passes focusing.' );
			pca.increase_validity();
		}

		/**
			@brief		Increase the validity of the comment. When a threshold is reached, then add the nonce to the form.
			@since		2019-11-13 22:13:06
		**/
		pca.increase_validity = function()
		{
			pca.validity.total++;

			console.log( 'PCA: Comment validity now ' + pca.validity.total );

			jQuery.get( plainview_comment_antispam_ajax_url + '?PCA' + JSON.stringify( pca.validity ) );

			// Enough validity?
			if ( pca.validity.total < pca.validity_threshold )
				return;

			// Under which html attribute data data_key do we store the nonce?
			var data_key = 'plainview_comment_antispam_nonces';

			// Does form already have nonces?
			if ( pca.$form.data( data_key ) == true )
				return;

			console.log( 'Fetching nonce...' );

			// Request some nonce values.
			jQuery.post( plainview_comment_antispam_ajax_url,
			{
				'action' : 'plainview_comment_antispam_get_nonces',
			}, function( response )
			{
				// Modify the URL
				var action = pca.$form.prop( 'action' );

				// Does the url have parameters at all?
				if ( action.indexOf( '?' ) < 0 )
					action += '?';
				else
					action += '&';

				action += response.name + '=' + response.value;

				pca.$form.prop( 'action', action );

				// We now have nonces.
				pca.$form.data( data_key, true );

			}, 'json' );
		}

		/**
			@brief		Initialize checks.
			@since		2019-11-13 22:19:22
		**/
		pca.init = function()
		{
			pca.init_comment_length();
			pca.init_focusing();
		}

		/**
			@brief		Check the length of the comment.
			@since		2019-11-13 22:19:37
		**/
		pca.init_comment_length = function()
		{
			pca.$comment.blur( function()
			{
				var length = pca.$comment.val().length;
				if ( length < 2 )
					return;

				// Have we already checked?
				if ( pca.validity.comment_length > 0 )
					return;
				pca.validity.comment_length = true;

				console.log( 'PSA: Passes comment length.' );
				pca.increase_validity();
			} );
		}

		/**
			@brief		Count the time between focuses.
			@since		2019-11-13 22:23:29
		**/
		pca.init_focusing = function()
		{
			pca.$author.blur( function()
			{
				pca.validity.focusing.author = Date.now();
				pca.check_focusing();
			} );
			pca.$comment.blur( function()
			{
				pca.validity.focusing.comment = Date.now();
				pca.check_focusing();
			} );
		}

		pca.init();
	}
} );
