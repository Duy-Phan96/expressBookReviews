# IBM Final Project – Express Book Review Application

- Öffentliches GitHub-Repository: [Duy-Phan96/expressBookReviews](https://github.com/Duy-Phan96/expressBookReviews)
- Öffentlicher Quellcode für Aufgabe 10: [final_project/router/general.js](https://github.com/Duy-Phan96/expressBookReviews/blob/67a158b7424ade8fa8ee2691d151d88512ec85e0/final_project/router/general.js)
- Fork-Ursprung: [ibm-developer-skills-network/expressBookReviews](https://github.com/ibm-developer-skills-network/expressBookReviews)

## Bewertungsaufgaben

| Nr. | Aufgabe | Nachweis | Ergebnis |
| --- | --- | --- | --- |
| 1 | Alle Bücher abrufen | [getallbooks.txt](getallbooks.txt) | HTTP 200, zehn Bücher |
| 2 | Buch nach ISBN abrufen | [getBooksByISBN.txt](getBooksByISBN.txt) | HTTP 200, ISBN 8 |
| 3 | Bücher eines Autors abrufen | [getbooksbyauthor.txt](getbooksbyauthor.txt) | HTTP 200, vier Bücher des Autors „Unknown“ |
| 4 | Bücher nach Titel abrufen | [getbooksbytitle.txt](getbooksbytitle.txt) | HTTP 200, „Pride and Prejudice“ |
| 5 | Buchrezensionen abrufen | [getbookreview.txt](getbookreview.txt) | HTTP 200, gespeicherte Rezension zu ISBN 8 |
| 6 | Neuen Benutzer registrieren | [Register.txt](Register.txt) | HTTP 201 |
| 7 | Registrierten Benutzer anmelden | [login.txt](login.txt) | HTTP 200, cURL speichert das Sitzungscookie lokal |
| 8 | Eigene Rezension hinzufügen und bearbeiten | [reviewadded.txt](reviewadded.txt) | HTTP 201 beim Anlegen, HTTP 200 beim Bearbeiten |
| 9 | Eigene Rezension löschen | [deletereview.txt](deletereview.txt) | HTTP 200, anschließender Abruf liefert `{}` |
| 10 | Alle Bücher sowie ISBN-, Autoren- und Titelsuche mit Axios asynchron aufrufen | [general-js-url.txt](general-js-url.txt) | Vier Funktionen gegen die laufende HTTP-API getestet |
| 11 | Öffentliches GitHub-Repository und Fork-Ursprung nachweisen | [Githubrepo.txt](Githubrepo.txt) | GitHub API meldet `fork: true` und das IBM-Repository als `parent` und `source` |

## Testergebnisse

- `npm ci` installierte die Abhängigkeiten aus der Lockdatei unter Node.js 24.14.0.
- `npm test` bestand alle 13 Integrationstests gegen einen lokalen Express-Server. Geprüft wurden die Bücher- und Rezensionsrouten, doppelte Registrierung, gültige und ungültige Anmeldung, Eingabefehler, unbekannte Bücher, Sitzungsschutz, die Schreibrechte zweier Benutzer, parallele Anfragen und die vier Axios-Aufrufe.
- `npm audit` meldete 0 bekannte Schwachstellen.
- Die Aufgaben 1 bis 9 enthalten die ausgeführten cURL-Befehle, HTTP-Statuscodes und vollständigen JSON-Antworten. Für eine Wiederholung mit einem frisch gestarteten Server zuerst Aufgaben 1 bis 4 ausführen, dann 6, 7 und 8, danach 5 und 9. Die Sitzung liegt in der lokalen Datei `cookies.txt`. Für Aufgabe 10 kann das Beispiel in der [README](https://github.com/Duy-Phan96/expressBookReviews#async-axios-functions) bei laufender API ausgeführt werden.

## Einreichung in Coursera

1. In [Modul 4 des IBM-Kurses](https://www.coursera.org/learn/developing-backend-apps-with-nodejs-and-express#modules) die Projektbewertung öffnen.
2. Für die Aufgaben 1 bis 9 die jeweils oben genannte TXT-Datei hochladen oder deren Inhalt in das zugehörige Textfeld übernehmen, je nach Eingabeformat. Falls die Kursmaske einen Screenshot verlangt, den entsprechenden cURL-Befehl erneut ausführen und dafür die echte Terminalausgabe erfassen.
3. Für Aufgabe 10 die URL aus `general-js-url.txt` einfügen.
4. Für Aufgabe 11 die URL des Forks eintragen. Falls auch der Ursprung belegt werden soll, den Befehl und die Ausgabe aus `Githubrepo.txt` beifügen.
5. Die Zuordnung im Formular prüfen und die Bewertung absenden.

## Offene Schritte und technische Grenzen

Die Einreichung in Coursera ist noch offen. Die API verwendet für Benutzer, Sitzungen und Rezensionen Arbeitsspeicher. Ein Serverneustart setzt diese Daten zurück.
