# v0.10.5 -

- No need to add goals again after a re-login if once done before. Fixes [#46](https://github.com/Razen04/GateQuest/issues/46).
- A user can't attempt questions from another branch which they can acess via shared link. Fixes [#45](https://github.com/Razen04/GateQuest/issues/45).

# v0.10.4 - 2026-03-11

- Added GATE EE (Electrical Engineering) PYQS. Will have many issues, I hope you guys report questions so I can fix them incrementally.
- Fixed unnecessary DB calls via Smart Revision.
- Updated FAQs section.
- Updated assets, let's see how they look, you might have to reinstall the PWA for ew assets to show up.

# v0.10.3 - 2026-03-09

- Added GATE EC (Electronics & Communication Engineering) PYQs.

# v0.10.2 - 2026-03-07

- Added GATE DA (Data Science & Artificial Intelligence) PYQs.
- Removed Guest Mode in the Practice Tab as of now.
- Fixed URL params to include exam filter too.

# v0.10.1 - 2026-03-05

- Added ISRO CS PYQs.
- Fixed question counts error and proper stats calculation.
- Added a dropdown to show individual exam statistics.

# v0.10.0 - 2026-03-03

- Extended the Keyboard shortcuts for the main practice page in the app and also added visual indicators. Fixes [#38](https://github.com/Razen04/GateQuest/issues/38).
- Numerical Answers now support range based answers, exact answers, multiple answers and answers with tolerance as these happen very frequently in competitive exams. Fixes [#39](https://github.com/Razen04/GateQuest/issues/39).
- Added dynamic difficulty feature for both Subjects and Questions. [#35](https://github.com/Razen04/GateQuest/issues/35).
- Expanding the scope of the project as a whole to include other branches and exams. This can be buggy so maybe clear cache for this and re-login, I will be monitoring this.

# v0.9.5 - 2026-02-08

- Added Clear Data feature, to clear your current progress and start fresh for new session. It has a limit for doing this at most 5 times only. Implemented [#33](https://github.com/Razen04/GateQuest/issues/33).
- Added Changelog button to see the changelogs without visiting [Github](https://github.com/Razen04/GateQuest). Implemented [#40](https://github.com/Razen04/GateQuest/issues/40).
- Updated the GATE exam date for next year and also the heatmap. Will add a way to view the last year data irrespective of the version of the account you are on.
- Clicking on the GATEQuest icon on the Navbar in mobile devices will bring to Dashboard.

# v0.9.4-hotfix - 2026-02-01

- Fixed the ActionButtons in the QuestionCard bug for desktop screen.
- Added last version changelog.

# v0.9.4 - 2026-01-30

- Re-embracing rounded corners.
- Fixed issue [#37](https://github.com/Razen04/GateQuest/issues/34).
- Fixed [#36](https://github.com/Razen04/GateQuest/issues/36).

# v0.9.3 - 2026-01-24

- Removed ugly scrollbars in chrome browsers (need to be tested).
- Auto-refresh logic for questions added, now no more clear cache and re-login.

# v0.9.2 - 2026-01-14

- Updated mobile dock to make it more clean and modern.
- Updated site.webanifest with new screenshots.

# v0.9.1 - 2026-01-14

- Updated the GATE exam date and completion date.

# v0.9.0 - 2026-01-12

- Added **Topic Test** feature, will add documentation for Supabase in next minor version.
- Added animated API support.
- Removed ghost API calls.
- Fixed bug which prevented changing name.
- Added [Dexie](https://dexie.org/) for indexedDB and for future local-first solution.

# v0.8.0 – 2025-12-16

- Added **Smart Revision** feature. See [SUPABASE DOCS](https://github.com/Razen04/GateQuest/blob/master/SUPABASE_DOCUMENTATION.md) for more information.
- Rolled out **AI explanations**. Explanations for questions will be added incrementally.
- Removed copy link from donations page for now and updated the instructions accordingly.
- Implemented ShadCN in the project which fixes Issue [#12](https://github.com/Razen04/GateQuest/issues/12)
- Added **Changelog** page to track updates and releases.
