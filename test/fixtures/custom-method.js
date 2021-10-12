function custom_method() {
  // var that = { trans: function () {} };
  // this.trans('Hello');
  // that.trans('World');
}

// https://github.com/wp-pot/wp-pot/issues/20
custom_metabox.add_field({
  title: __('Translate function in method call', 'testdomain'),
});
custom_metabox.add_field({
  title: this.trans('Custom translate function in method call', 'testdomain'),
});
