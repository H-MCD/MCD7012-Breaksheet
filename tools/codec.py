import re,json,base64,sys
def parts(s):
    a=json.loads(re.search(r'var _a=(\[.*?\]),_o',s).group(1))
    o=json.loads(re.search(r'_o=(\[.*?\])',s).group(1))
    k=json.loads(re.search(r'_k=(\[.*?\])',s).group(1))
    return a,o,k
def decode(s):
    a,o,k=parts(s)
    b=''.join(a[n] for _,n in sorted((i,n) for n,i in enumerate(o)))[::-1]
    r=base64.b64decode(b);p=90;u=bytearray()
    for i,x in enumerate(r): u.append(x^((k[i%len(k)]+i*7+p)&255));p=x
    return json.loads(u.decode())
def encode(s,d):
    a,o,k=parts(s)
    u=json.dumps(d,ensure_ascii=False,separators=(',',':')).encode()
    p=90;c=bytearray()
    for i,x in enumerate(u):
        y=x^((k[i%len(k)]+i*7+p)&255);c.append(y);p=y
    b=base64.b64encode(bytes(c)).decode()[::-1]
    n=len(o);L=-(-len(b)//n);ch=[b[j*L:(j+1)*L] for j in range(n)]
    na=[ch[o[j]] for j in range(n)]
    out=re.sub(r'var _a=\[.*?\],_o',lambda m:'var _a='+json.dumps(na)+',_o',s,count=1)
    assert decode(out)==d
    return out
if __name__=='__main__':
    cmd,src=sys.argv[1],sys.argv[2]
    s=open(src).read()
    if cmd=='dec': json.dump(decode(s),open(sys.argv[3],'w'),ensure_ascii=False,indent=1)
    else: open(src,'w').write(encode(s,json.load(open(sys.argv[3]))))
