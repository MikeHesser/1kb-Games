# 1kb-Games
Small Amstrad-CPC games. Each game is not longer than 1024 bytes


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

```basic
10 MODE 1:INK 0,0:BORDER 0:INK 3,11:w=110:h=5
20 SYMBOL 250,7,56,64,169,64,127,31:SYMBOL 251,224,28,2,149,1,254,248
30 SYMBOL 240,254,146,254,146,254,146,254,146
40 MODE 1:LOCATE 1,1:PRINT"SCORE:";sc:LOCATE 1,25:PRINT STRING$(40,207);:PEN 3
50 FOR n=2 TO 40:FOR y=0 TO RND*h+2
60 LOCATE n,24-y:PRINT CHR$(240);
70 NEXT:NEXT:x=1:y=2:f=1:PEN 1
80 LOCATE x,y:PRINT CHR$(8);" "CHR$(250);CHR$(251):x=x+1:IF x>40 THEN x=1:y=y+1
90 IF y=24 AND x=15 THEN LOCATE 17,12:PRINT CHR$(24);"GESCHAFFT!";CHR$(24):FOR t=1 TO 1500:NEXT:w=w-5:h=h+1:GOTO 40
100 SOUND 1,2300,18:SOUND 2,2298,18
110 IF TEST(x*16+8,410-y*16)THEN SOUND 1,1000,50,,,,15:LOCATE x,y:PRINT CHR$(8);" "CHR$(238):GOTO 180
120 IF NOT INKEY(47)AND f THEN a=x:b=y+1:f=0:z=7
130 IF f=1 THEN FOR i=1 TO w:NEXT:GOTO 80
140 LOCATE a,b:PRINT " ":b=b+1
150 IF TEST(a*16-8,402-b*16)=3 THEN z=z-1:sc=sc+1:LOCATE 7,1:PRINT sc
160 LOCATE a,b:IF z=0 OR b=25 THEN f=1:PRINT CHR$(11);" ";:GOTO 80
170 PRINT CHR$(252);:FOR i=1 TO w/2:NEXT:GOTO 80
180 LOCATE 17,12:PRINT CHR$(24);"SCHADE!";CHR$(24):LOCATE 14,14:PRINT"Nochmal (j/n)?"
190 a$=UPPER$(INKEY$):IF a$<>"J"AND a$<>"N"THEN 190
200 IF a$="J"THEN RUN
```
