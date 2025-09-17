# Contributing to GATEQuest

First off, thank you for considering contributing to GATEQuest\! It's people like you that make GATEQuest such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/Razen04/GateQuest/issues/new)\! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

### Fork & create a branch

If this is something you think you can fix, then [fork GateQuest](https://github.com/Razen04/GateQuest/fork) and create a branch with a descriptive name.

A good branch name would be (where issue \#38 is the ticket you're working on):

```bash
git checkout -b 38-add-multiple-filters
```

### Working with the Supabase Backend

Our backend is powered by Supabase. All development is done against a **local Supabase instance** that runs on your machine using Docker. This gives you a safe, private, and fully-featured environment to work in, complete with test data.

For detailed, step-by-step instructions on setting up the local environment and making database schema changes, please read our **[SUPABASE_GUIDE.md](SUPABASE_GUIDE.md)**.

### Get the style right

Your patch should follow the same conventions & pass the same code quality checks as the rest of the project.

### Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with GATEQuest's master branch:

```bash
git remote add upstream git@github.com:Razen04/GateQuest.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it\!

```bash
git checkout 38-add-multiple-filters
git rebase master
git push --force-with-lease origin 38-add-multiple-filters
```

> Reminder: You push changes only to your fork. Maintainers are the only ones who can merge into the official repo’s master.

Finally, go to GitHub and [make a Pull Request](https://github.com/Razen04/GateQuest/compare).

### Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing and merging, check out this guide on [syncing a fork](https://help.github.com/articles/syncing-a-fork).
