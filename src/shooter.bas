100 h=100:s=2:a=FIX(RND*100)*2:b=FIX(RND*110)*2+400
110 MODE 1:INK 0,0:DEG:FOR n=0 TO 640 STEP 2
120 IF RND<0.4 THEN s=-s
130 h=h+s:y=h+SIN(n+170)*f:IF y<0 THEN y=0
140 IF a=n THEN c=y ELSE IF b=n THEN d=y
150 MOVE n,y:IF n>200 AND n<350 THEN f=210 ELSE f=100
160 DRAW n,0,3:NEXT:PLOT 0,-2,2
165 TAG:MOVE a,c+16:PRINT CHR$(244);:PLOT 0,-2,1:MOVE b,d+16:PRINT CHR$(244);
180 TAGOFF:PEN 3:LOCATE 1,1:PRINT "Player ";pl+1
190 INPUT"Winkel ",w:w=90-w:INPUT "Staerke ",s
200 IF pl THEN w=-w:e=b:f=d ELSE e=a:f=c
210 x=SIN(w):y=COS(w):vx=s*x/4:vy=s*y/4
220 x=e+x+8:y=f+y+16:TAG:t=0
240 WHILE t=0 AND x>0 AND x<640 AND y>0 AND y<400
250 CALL &BD19:PLOT x,y,0:x=x+vx:y=y+vy:vy=vy-0.09
270 t=TEST(x,y):PLOT x,y,1:WEND
290 PLOT 0,-2,1:MOVE x-8,y+8:PRINT CHR$(238);
300 FOR n=1 TO 100:NEXT:MOVE x-8,y+8:PRINT " ";
320 pl=ABS(pl=0):TAGOFF:IF t=3 OR t=0 THEN 180
330 PRINT"Player";t;"hat gewonnen"