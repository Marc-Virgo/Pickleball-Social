SOCIAL PICKLEBALL CLUB - STATIC SITE

Files:
- index.html       Home/navigation page
- attendance.html  Player name entry and attendance
- matches.html     Social match scheduler
- storage.js       Browser localStorage persistence
- attendance.js    Player management
- scheduler.js     Social-diversity optimization and bye fairness
- matches.js       Match/session control
- styles.css       Responsive phone-friendly styling

CORE SCHEDULING RULES
1. Player count determines courts used.
2. Courts used = min(floor(present players / 4), maximum courts).
3. Eight courts is the default venue maximum, not the primary determinant.
4. Any players beyond court capacity sit out.
5. Sit-outs are selected from players with the fewest prior byes first.
   This prevents a second bye while another present player has had fewer.
6. Among equally eligible bye candidates, players with more games receive
   preference for a rest.
7. Active players are arranged through repeated randomized optimization.
8. Previous partner pairings receive a strong repeat penalty.
9. Previous opponent pairings receive a smaller repeat penalty.
10. New partners and new opponents are therefore strongly favoured.

DEFAULT SESSION
- 120 minutes
- 10 minute games
- up to 12 rounds
- maximum 8 courts / 32 active players each round

HOSTING ON GITHUB PAGES
Upload all files in this folder to a GitHub repository and enable GitHub Pages
for the branch/folder containing index.html.

DATA STORAGE
All data is stored in the browser's localStorage on the device running the site.
There is no server or cloud database in this version.

- stats.html       Per-player unique partner/opponent statistics
- stats.js         Statistics calculation and display

V4:
- Court selection page for Courts 1–10.
- Player count remains the primary determinant of courts actually used.
- Matches are assigned to the selected physical court numbers.
- Larger court labels and player names.
- Repeat byes target at least 60 minutes apart whenever mathematically possible.
- Fewest-total-byes fairness remains the first priority.

- about.html       Credits and version history page

V1.1 ABOUT PAGE NOTES
- Version 1.0 deployed August 2026.
- Version 1.1 added About Page and Court Selection Page.
- Version 1.1 improved sit-out balancing to reduce closely spaced repeat sit-outs.
- Version 1.1 increased player-name and court-number font sizes on mobile.
