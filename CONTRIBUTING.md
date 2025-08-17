# Contributing to GATEQuest

First off, thank you for considering contributing to GATEQuest! It's people like you that make GATEQuest such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/Razen04/GateQuest/issues/new)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

### Fork & create a branch

If this is something you think you can fix, then [fork GateQuest](https://github.com/Razen04/GateQuest/fork) and create a branch with a descriptive name.

A good branch name would be (where issue #38 is the ticket you're working on):

```
git checkout -b 38-add-spanish-translations
```

### Get the style right

Your patch should follow the same conventions & pass the same code quality checks as the rest of the project.

### Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with GateQuest's master branch:

```
git remote add upstream git@github.com:Razen04/GateQuest.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```
git checkout 38-add-spanish-translations
git rebase master
git push --force-with-lease origin 38-add-spanish-translations
```

Finally, go to GitHub and [make a Pull Request](https://github.com/Razen04/GateQuest/compare)

### Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing and merging, check out this guide on [syncing a fork](https://help.github.com/articles/syncing-a-fork).
