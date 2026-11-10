# 1kB-Games
Eine Sammlung kleiner Schneider-CPC Spiele. Jedes Spiel ist nicht länger als 1kB (1024 bytes).

**Im Browser spielen:** https://mikehesser.github.io/1kb-Games/play/

Dort laufen die originalen BASIC-Listings unverändert auf einer kleinen, in JavaScript geschriebenen Schneider-CPC-Emulation (`play/cpc.js`).

## EMERGENCY

!!!!ALARM!!!! Sie als Kapitän des Raumschiffs KENTERPRISE bekommen gerade die Meldung, dass
beim Erforschen der gebirgigen Oberfläche des noch relativ unbekannten Planeten PROXIMA 4-712Y
ein Meteorit den Treibstofftank beschädigt hat. Es gibt nur einen Ausweg - eine geeignete
Landebahn zu finden, bevor der Tank völlig ausläuft. Doch unglücklicherweise reicht der 
Treibstoff nur noch bis zu einer verlassenen Ruinenstadt.

Ihre Aufgabe ist es nun, mit Bomben gezielt die Gebäude der Stadt zu zerstören, um sich
eine Landebahn zu schaffen. Dabei fliegt Ihr Raumschiff von links nach rechts über den
Bildschirm und verliert ständig an Höhe. Mit der <SPACE>-TASTE können Sie unbegrenzt Bomben
abwerfen, aber immer nur eine gleichzeitg!

Es ist ratsam, immer die höchsten Gebäude zu bombardieren,
sonst kommt es unweigerlich zur Kollision. Sind Sie sicher gelandet, kommt der nächste Level,
aber mit dem Unterschied, daß Ihr Raumschiff noch schneller sinkt.
 
▶ [Im Browser spielen](https://mikehesser.github.io/1kb-Games/play/emergency/)

![Emergency](https://github.com/MikeHesser/1kb-Games/blob/main/images/emergency.png)

## Shooter
 
In diesem Spiel versuchen zwei Spieler gegenseitig ihre Bodenkanone über einen gezielten Schuss zu zerstören. Über die Angabe der Schussstärke und des Schusswinkels wird die Flugbahn des Geschosses bestimmt, die zudem über einen Berg führen muss.
 
▶ [Im Browser spielen](https://mikehesser.github.io/1kb-Games/play/shooter/)

![Shooter](https://github.com/MikeHesser/1kb-Games/blob/main/images/shooter.png)
 
## Die Türme von Hanoi
 
Die "Türme von Hanoi" ist ein bekanntes Strategiespiel. Ziel ist es, ein Turm bestehend aus Steinen an einem anderen Ort neu aufzubauen indem jeder einzelne Stein umgeschichtet wird. 
Die Umschichtung erfolgt über die Angabe der Position des Steines sowie des Zielortes. Dabei darf der Stein nicht größer als der Stein am Zielort sein.

▶ [Im Browser spielen](https://mikehesser.github.io/1kb-Games/play/hanoi/)

![Hanoi](https://github.com/MikeHesser/1kb-Games/blob/main/images/hanoi.png)

## Hunting
 
Das Ziel bei diesem Spiel ist einfach: Solange wie möglich am Leben bleiben! Versuche den bösartigen Miesemoppeln auszuweichen die auf dem ganzen Feld verstreut sind. Verboten ist auch die eigene Spur zu betreten die man hinterlässt. Dazu kommt noch ein jagender Miesmoppel hinzu der einen auf Schritt und Tritt verfolgt. Zum Glück gibt es ja noch den Bildschirmrand zum Flüchten...

Die Steuerung erfolgt über die Cursortasten.
 
▶ [Im Browser spielen](https://mikehesser.github.io/1kb-Games/play/hunting/)

![Hunting](https://github.com/MikeHesser/1kb-Games/blob/main/images/hunting.png)
 
## Moonlander

Bei diesem Geschicklichkeitsspiel hat der Spieler die Aufgabe, seine Raumfähre auf einem Landeplatz unter der Mondoberfläche zu landen. Dabei kann er über die Cursortasten den horizontalen und den vertikalen Schub regeln.
Hat man die Fähre erfolgreich an den Landeplatz gebracht fängt das ganze von vorne an. Mit einem Unterschied: Der Tunnel ist noch schmäler... 

Cursor oben: Schub vertikal
Cursor links: Beschleunigung nach links
Cursor rechts: Beschleunigung nach rechts
 
▶ [Im Browser spielen](https://mikehesser.github.io/1kb-Games/play/moonlander/)

![Moonlander](https://github.com/MikeHesser/1kb-Games/blob/main/images/moonlander.png)

## Tron

Ein Spiel für zwei Spieler nach dem Lichtrad-Rennen aus dem Film "Tron". Beide Spieler fahren über den Bildschirm und ziehen dabei eine Spur hinter sich her. Wer gegen eine Spur oder gegen die Wand fährt, verliert die Runde: Der Bildschirm blinkt in der Farbe des Verlierers und der andere Spieler bekommt einen Punkt. Dann beginnt die nächste Runde.

Mit der Turbo-Taste kommt man in einem Schritt zwei Pixel statt einem voran – so kann man sogar über eine Spur springen.

* Spieler 1 (gelb): Cursortasten, Turbo mit der SPACE-Taste
* Spieler 2 (türkis): W (oben), Z (unten), A (links), S (rechts), Turbo mit der kleinen ENTER-Taste

▶ [Im Browser spielen](https://mikehesser.github.io/1kb-Games/play/tron/)

![Tron](https://github.com/MikeHesser/1kb-Games/blob/main/images/tron.png)

## Zu den Browser-Versionen

`play/cpc.js` enthält einen kleinen Locomotive-BASIC-Interpreter und die Teile des CPC, die die Spiele brauchen:
MODE 1 mit der 27-Farben-Palette, Textfenster, PRINT/INPUT mit Steuerzeichen, Grafik (PLOT, DRAW, TEST, TAG und XOR-Modus),
SOUND mit Warteschlange, EVERY-Interrupts, INKEY mit den CPC-Tastennummern und ungefähr das Tempo des echten Rechners.
Der Bildschirm verwendet den originalen CPC-Zeichensatz.
Nach „Ready“ startet Enter oder ein Klick das Spiel neu, Esc bricht ein laufendes Programm ab.
