# Design submission — APS-05

**Distributed Booking & Inventory System**  
Kognivera Hackathon 2026 · design submission due **2 September 2026**

Your design submission is the first thing that gets assessed. It is not a formality and it is not a slide deck about how excited you are — it is the document that shows you understand the problem, have scoped it honestly to 24 hours, and know how you will spend those hours.

---

## 1. Before you write anything

Read your statement and its 24-hour MVP scope on your statement's page in the hackathon application. Then, in the folder this document came from:

1. `01_YOUR_DATA_MODEL` — every table and field you have been given.
2. `02_DATA_MODEL_DIAGRAM.html` — download it and open it in a browser. Click through the tables you plan to use.
3. `data/queries/starter_queries.sql` — run them against `data/APS-05.db`. Ten minutes of running real queries will change what you design.

A design written before anyone on the team has opened the database is visible from a long way off.

---

## 2. What your design submission must contain

One document. The order below is a suggestion, the content is not.

| # | Section | What we are looking for |
|---|---|---|
| 1 | Cover | Team name, problem statement ID and title, every member's name and role. |
| 2 | Problem understanding | The problem in your own words. Not copied from the statement — if we can diff it against our text, it tells us nothing. |
| 3 | Scope | Two lists: what you will build in the 24 hours, and what you are deliberately leaving out. The second list is the one that shows judgement. |
| 4 | User journey | The main flow, end to end, from the traveller's point of view. Two or three screens sketched is worth more than ten described. |
| 5 | Architecture | One diagram. Components, what talks to what, where the AI sits, where the data sits. |
| 6 | Data model usage | Which of the provided tables you will use, and anything you are adding beside them. Say explicitly that you are extending rather than renaming. |
| 7 | AI approach | What the AI actually does, how you ground it, and how you will know it is working. If your statement has a measurable target, say how you will measure it. |
| 8 | Tech stack | What you are using and, in one line each, why. |
| 9 | 24-hour plan | Hour by hour, or at least in four-hour blocks. Who is doing what. When you stop building and start rehearsing the demo. |
| 10 | Risks and fallbacks | Three things most likely to go wrong, and what you will do instead. A team with no fallbacks has not thought about the day. |
| 11 | Multilingual approach | Which languages, where they appear, how you handle them. |

### The two things that most often let a design down

**Scope that does not fit 24 hours.** The MVP section of your statement exists for a reason. A design that promises the full product will be read as a design that has not been thought about.

**An AI feature described but not designed.** "We will use an LLM to summarise reviews" is not a design. Which reviews, retrieved how, prompted how, grounded in what, and how do you know the output is right?

---

## 3. What the application will accept

| | |
|---|---|
| **Documents** | pdf · doc · docx · ppt · pptx · xls · xlsx · txt · md · rtf |
| **Images** | jpg · jpeg · png · gif · webp · svg · bmp · tiff |
| **Design and diagram files** | drawio · xml · vsdx · fig · sketch · xd · rtb · mrx  (draw.io, Visio, Figma, Sketch, Adobe XD, Miro) |
| **Archives and other** | zip · fodg · odg |

Anything not on that list is rejected outright with *"File type … is not allowed."* Executables and scripts are blocked — if you want to share code, put it in a `.zip` or give us a repository link inside the document.

### Limits

| Limit | Value |
|---|---|
| Maximum size per file | **25 MB** |
| Maximum files per submission | **10** |
| Number of submissions | **One.** Once you upload, your submission is locked. |

> ### Read this twice
> **You get one upload.** There is no replace, no second attempt, no "we uploaded the wrong version". Assemble everything, have someone who did not write it read it, and only then upload.

---

## 4. How to package it

The safest submission is **one PDF**. PDF renders identically everywhere; a .pptx or a .docx may not look the way it looked on your machine, and a Figma or draw.io file needs the right tool to open.

- **Export your design document to PDF** and make that file one.
- If you want to include the editable source — a `.fig`, `.drawio`, `.vsdx`, `.sketch` — add it as a second file. Do not make it the only copy of anything.
- Wireframe images are fine as separate files, but a PDF that already contains them is better than nine loose PNGs against a 10-file cap.
- Anything over 25 MB will be rejected. Compress images before exporting; a design document should not be near that size.
- If you genuinely have more than 10 files, put the extras in a single `.zip`.

### Naming

```
<TeamName>_APS-05_Design_v1.pdf
<TeamName>_APS-05_Wireframes.pdf
<TeamName>_APS-05_Architecture.drawio
```

Underscores, no spaces, no special characters. It makes your submission findable when there are two hundred of them.

---

## 5. Uploading

1. Sign in to the hackathon application with the account your team lead registered.
2. Open your team, then **Design Submission**.
3. Confirm the problem statement shown is APS-05. If it is not, stop and contact the organisers — do not upload.
4. Add your files. Up to 10, each under 25 MB.
5. Check the file list on screen against your own list. Count them.
6. Submit. **The submission locks at this point.**
7. Save or screenshot the confirmation.

*[TBC — application URL and the exact deadline time on 2 September]*

### Pre-upload checklist

- [ ] Every section in the table above is present
- [ ] Scope names what you are **not** building
- [ ] The 24-hour plan has hours against it, and names against the hours
- [ ] The architecture diagram is legible at 100% zoom
- [ ] Someone outside the team has read it and understood what you are building
- [ ] Exported to PDF and reopened to check it rendered
- [ ] Every filename follows the convention
- [ ] 10 files or fewer, each under 25 MB
- [ ] The statement ID on screen matches this document

---

## 6. After you submit

| When | What |
|---|---|
| 2 September | Submission closes. |
| By 17 September | Teams confirmed. |
| 24–25 September | The 24-hour sprint. See `04_HACKATHON_DAY_PROCESS`. |
| 26 September | Finale and prize distribution. |

Your design is the plan you will be building against, so keep working from it. If your build ends up differing from the design, that is fine and often sensible — be ready to say why on the day.

Questions about the submission process go to the organisers. Questions about the data go to the data channel named in the email that sent you this folder.
