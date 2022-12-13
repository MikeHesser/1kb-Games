	
100 MODE 1:INPUT"Steine:";w:IF w<2 OR w>6 THEN RUN
110 ms=2^w-1:DIM st(w,3):CLS:LOCATE 1,15:PRINT STRING$(40,207)
120 FOR n=15-w TO 14:LOCATE 1,n:f=(n MOD 3)+1:z=z+1:s$(z)=SPACE$(6-z)+CHR$(15)+CHR$(f)+CHR$(213)+STRING$(z*2-2,143)+CHR$(212):PRINT s$(z):st(w-z+1,1)=z:NEXT:h(1)=w
130 LOCATE 5,16:PEN 1:PRINT 1;SPC(10);2;SPC(10);3:WINDOW#1,1,40,17,25
140 CLS#1:PRINT#1,"Zuege:";ms-x:INPUT#1,"Von:",a:IF a<1 OR a>3 THEN 140 ELSE j=h(a):IF j=0 THEN 140
150 INPUT#1,"Nach:",b:IF b<1 OR b>3 THEN 150
160 p=st(j,a):c=st(h(b),b):IF c THEN IF p>c THEN 140
170 POKE &B28B,100:z$=s$(p):FOR n=15-j TO 3 STEP-1:g=(a-1)*13+1:GOSUB 230:NEXT
180 st(j,a)=0:h(a)=h(a)-1:h=(b-1)*13+1:IF h<g THEN s=-1 ELSE s=1
190 FOR n=g TO h STEP s:LOCATE n,3:PRINT" ";z$;" ":NEXT
200 FOR n=3 TO 14-h(b):g=h:GOSUB 230:NEXT:LOCATE g,n-1:PRINT z$
210 POKE &B28B,40:x=x+1:IF x>ms THEN PRINT"Nicht ";:GOTO 240
220 h(b)=h(b)+1:st(h(b),b)=p:IF h(3)=w THEN 240 ELSE 140
230 LOCATE g,n:PRINT z$:LOCATE g,n:PRINT SPACE$(13):RETURN
240 PRINT"geschafft!"