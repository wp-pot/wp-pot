## Contributing to wp-pot

Everyone is welcome to contribute with patches, bug-fixes and new features.

## Ideas

If you have a idea the easiest way is to create a [issue](https://github.com/wp-pot/wp-pot/issues).

## Bugs

Before you submit a bug issue you should be able to run the tests that the project has. Then you know if the tests works or not.

When you submit a bug issue you should try to be as detailed as possible in your bug issue so we can help you better with the issue.

**Please** write how to reproduce the bug.

## Pull requests

Good pull requests with patches, improvements or new features is always welcome. They should remain focused in scope and avoid containing unrelated commits.

**Please follow** the projects code style. The project code should be following the code style that is based on [JavaScript Standard Style](https://standardjs.com/#the-rules) but with semicolons (semistandard).

* Fork [wp-pot](https://github.com/wp-pot/wp-pot) on Github and add the upstream remote.

```
git clone https://github.com/<your-username>/wp-pot.git
cd wp-pot
git remote add upstream https://github.com/wp-pot/wp-pot.git
```

This is useful if you cloned your repo a while ago and you now want to updated it.

```
git checkout master
git pull upstream master
```

* Create a new branch:

```
git checkout -b <topic-branch-name>
```

* Make sure to update, or add to the tests when appropriate.
* Commit your changes to your fork.
* Locally merge (or rebase) the upstream development branch into your topic branch:

```
git pull [--rebase] upstream master
```

* Push to your branch:

```
git push origin <topic-branch-name>
```

* [Open a Pull Request](https://help.github.com/articles/using-pull-requests/) with a clear title and description against the `master` branch.

**Note:**
If you are making several changes at once please divide them into multiple pull requests.

## License

By contributing your code, you agree to license your contribution under the [MIT license](https://github.com/wp-pot/wp-pot/blob/master/license).
