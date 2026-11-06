# Briefs

Fill in the `<…>`; send the rest verbatim.

## Grok

One per group of about 10 slugs. `<n>` is 2. `<inbox>` is `$SRC/inbox`, as an absolute path: Grok runs in this checkout, not in the sources, so a relative `inbox/` lands in the wrong folder (it happened, and Grok reported success).

```
Generate ingredient images with your image generation tool (image_gen). Your job is to generate and save; the images are reviewed by another agent afterwards, so move straight on to the next image once a file is saved.

Sources: <$SRC, absolute path>. Inbox: <inbox>. Your working directory is another folder: use these absolute paths for every read, write and listing, never a relative path.
For each slug below, the prompt is the full content of style.txt followed by that slug's `subject` from subjects.json, verbatim. Aspect ratio 1:1.

Make <n> images per slug, one image_gen call at a time. Right after each call, copy the file that call produced to <inbox>/<slug>.<k>.<ext>: <k> is the next number free for that slug in <inbox> (1 when it has none; list <inbox> to find it), <ext> is the produced file's extension (honey, second image → <inbox>/honey.2.jpg). The path is in the tool result; otherwise it is the newest file in your session's images/ folder.

Write only inside <inbox>: subjects.json, style.txt and raw/ stay as they are, and git is not yours to run.

Slugs: <slugs>

When done, reply with one line per slug listing the absolute paths of the files written.
```

## Reviewer

One per 4 sheets. A slug may have candidates from several rounds: they are all compared. `<batch>` lists every slug of the batch, including those on other sheets.

```
You review generated ingredient icons for a recipe app, where they show at 20 to 32 px. On the contact sheets, each slug's id starts its first line, above the icon it shows today (its own, a parent's, or none), and its candidates follow, two per line. Per candidate: the raw image on magenta, the cut-out on a light and on a dark background, then the cut-out reduced to 24 px and enlarged (what a recipe list shows). Under each candidate: its number and automatic flags (magenta in object, uneven background, cropped, too small, unreadable). A flag tells you where to look; you decide.

Sheets: <absolute paths>
Style of the set, for comparison: <checkout>/icons/png/256/tomato.png, olive-oil.png, parsley.png

Slugs on your sheets, with the subject the image must show:
- <slug>: "<subject>"
- …

The whole batch, which must stay distinct at 24 px: <batch>

A candidate passes when all five hold:
1. Subject: it shows that ingredient, with the features the subject names.
2. Tiny: the 24 px version still reads as that ingredient.
3. Cut-out: on the dark background, the object has no magenta or pink patch, halo or speckle, inside or along its edge.
4. Style: soft matte 3D like the reference icons, no outline, no text, letters, numbers, logo or symbol, no face, no floor or cast shadow, the whole object in frame.
5. Distinct: at 24 px it reads differently from the icon the slug shows today, and from the other slugs of the batch (a pork tenderloin that could pass for a chicken fillet fails).

Pick the best passing candidate of each slug. Reply with exactly one line per slug and nothing else:
<slug>: PICK <number>
<slug>: REJECT <failed criteria numbers>: <what is wrong, and what to change in the subject to fix it>
```
