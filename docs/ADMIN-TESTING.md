# Testing the site admin

This is a checklist for trying every admin feature **before** PR #3 is merged. Run it in **test mode** so nothing reaches the live website.

- Preview site: <https://deploy-preview-3--sahan-group.netlify.app>
- Admin in test mode: <https://deploy-preview-3--sahan-group.netlify.app/admin/?branch=admin-sandbox>
- Time: about 20 minutes

Tick each box as you go. If a result looks different from what's written here, screenshot it and send it in the project thread.

---

## 0. One-time setup (5 min)

**0.1 Make a sandbox branch.** The admin writes test changes here instead of the live site.

1. Go to <https://github.com/yuga666/sahan-group>.
2. Click the branch dropdown (it shows `main`) and pick **claude/properties-admin**.
3. Click the dropdown again, type `admin-sandbox` and choose **Create branch admin-sandbox from claude/properties-admin**.

**0.2 Make a GitHub token.**

1. Go to GitHub → your photo → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Fill it in:
   - Name: `Sahan admin`
   - Expiration: 90 days
   - Repository access: **Only select repositories** → `sahan-group`
   - Permissions → Repository → **Contents: Read and write** (leave everything else as it is)
3. Click **Generate** and copy the token, which starts with `github_pat_`. Keep it private. Anyone who has it can edit the site.

- [ ] Sandbox branch `admin-sandbox` exists
- [ ] Token copied

---

## 1. Sign in

1. Open the **admin in test mode** link above.
2. Check that the top bar shows a red **Test mode · admin-sandbox** badge.
3. Paste the token and click **Connect**.

- [ ] Red test-mode badge is visible. **If it isn't, stop:** you'd be editing the live site.
- [ ] The Properties tab shows **AVORA Residences · Live · Gampaha**
- [ ] A wrong token (change one letter) shows "That token was not accepted"

---

## 2. Properties tab

**2.1 Check AVORA.** Click **Edit** on AVORA.

- [ ] The form is filled in: name, type, Gampaha, "Upcoming, Launching now", the description ("…delivered by Sahan Group…"), bedrooms, parking, floors, timeline, price 24M, link `#residences`
- [ ] The live preview on the right looks like the card on the Properties page
- [ ] While the editor is open, the list buttons and **Add property** are greyed out

Click **Cancel**.

**2.2 Add a test property.** Click **Add property** and fill in:

| Field | Value |
|---|---|
| Name | `TEST Heights` |
| Location | `Yakkala` |
| Status tags | `Newly launched, On going project` |
| Bedrooms | `2 & 3 bedroom apartments` |
| Price | `30M` |
| Explore link | `#register` |
| Photo | any WebP, JPG or PNG under 2 MB |

- [ ] The preview updates as you type and shows the photo
- [ ] A file over 2 MB is refused with a message
- [ ] Typing `javascript:alert(1)` as the link shows "This link format isn't allowed"
- [ ] Changing a field and trying to close the tab shows the browser's "Leave site?" warning

Put the link back to `#register` and click **Done**.

- [ ] TEST Heights appears in the list under AVORA
- [ ] **Publish changes** is now gold (enabled)

**2.3 Reorder and hide.** Click **Up** on TEST Heights, then **Hide**.

- [ ] It moves above AVORA and shows **Hidden**

**2.4 Publish.** Click **Publish changes**.

- [ ] The status says "Saved to test branch admin-sandbox. The live site is unchanged." and shows a **View the change** link
- [ ] **View the change** opens **one** commit on GitHub that holds the photo and `data/properties.json` together
- [ ] **Publish changes** goes grey again

**2.5 Delete.** Click **Delete** on TEST Heights.

- [ ] The first click only changes the button to **Confirm delete**. If you wait 4 seconds, it goes back to Delete.
- [ ] Clicking **Confirm delete** removes it. Then click **Publish changes**.

---

## 3. Site settings tab

1. Click **Site settings**.

- [ ] Fields show `info@sahangroup.lk`, `careers@sahangroup.lk`, `077 239 9049`, `+94 33 223 3004` and the Google Maps link. Socials are empty.

2. Try bad values: email `abc` and Facebook `facebook.com/x` (no https).

- [ ] **Publish settings** shows an error for each one and sends nothing

3. Enter valid test values:
   - Main email `test@sahangroup.lk`
   - Instagram `https://www.instagram.com/sahangroup`
   - Then click **Publish settings**.

- [ ] The status says files were updated
- [ ] **View the change** shows one commit that changes `index.html`, `about.html`, `verticals.html`, `properties.html`, `careers.html`, `404.html`, `assets/js/main.js` and `data/site.json`
- [ ] In that commit, only the email and the Instagram links changed. Nothing else on any page.

4. Put the email back to `info@sahangroup.lk`, clear Instagram, and publish again.

- [ ] The commit reverses the change

---

## 4. Change text tab

1. Click **Change text**.
2. Find `Sahan Engineering & Constructions` and replace it with `Sahan Group`. Click **Find matches**.

- [ ] It lists the pages with counts, about 12 matches in total
- [ ] **Replace and publish** becomes enabled

3. Click **Replace and publish**.

- [ ] One commit appears. Open it and check that only that phrase changed, in visible text, image descriptions and page descriptions. No links or code changed.

4. Try `Find: ab` (too short) and `Find: <p>` (has `<`).

- [ ] Each one shows an error and nothing is sent

> If you actually **want** that wording site-wide, do this step on the live admin (no `?branch=`) after merge.

---

## 5. Look at the result (optional)

If Netlify branch deploys are on, the sandbox site is at <https://admin-sandbox--sahan-group.netlify.app>. If not, open `admin-sandbox` on GitHub and look at the commits.

- [ ] Properties page → **06 Portfolio** shows only cards marked Live
- [ ] Each card's Explore button jumps to the right place

---

## 6. Clean up

1. Delete the `admin-sandbox` branch on GitHub (Branches → bin icon).
2. When you're happy, merge PR #3. The real admin is then at **`https://<your-domain>/admin/`** with no `?branch=`, and the badge reads **Live site**.
3. If a token was shared or leaked, revoke it in the same GitHub token page.

---

## Automated checks (for developers)

```bash
cd tests && npm install && npm test
```

This runs 16 browser checks against a local copy of the site under the production security policy, with GitHub mocked. Nothing real is changed.
