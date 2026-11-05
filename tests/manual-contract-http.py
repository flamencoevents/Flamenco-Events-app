# Manual integration test. Requires two temporary client accounts in FE_TEST_AUTH_FILE.
# Accounts, assignments and contract state are provisioned separately, only in test mode.
# Never commit the credentials file. Retire sessions and credentials after the run.
import json, pathlib, urllib.request, urllib.error, hashlib, sys, os
root=pathlib.Path(__file__).parent
auth=pathlib.Path(os.environ['FE_TEST_AUTH_FILE'])
users=json.loads(auth.read_text())
url='https://vulbpjayunvlpftgfzyf.supabase.co'
key='sb_publishable_wVLeUVBKBDMVDPXYdZdfkg_Q-C4AK37'
event='e4a35ff8-2fca-4e23-83ed-ffb4ab3c45de'
doc='26033a63-7537-4f12-a45d-4dcbf79ab95d'
path=event+'/contract-v1-0bd1f55bb5225e0398e4d86e5d1c20460d1ecf3ffbe17b1323c3315eebacbbf0.pdf'
def call(path, data=None, token=None, method=None, raw=False):
    headers={'apikey':key,'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    req=urllib.request.Request(url+path, headers=headers,data=None if data is None else json.dumps(data).encode(),method=method)
    try:
        with urllib.request.urlopen(req,timeout=60) as r:
            b=r.read();return r.status,b if raw else json.loads(b or b'null')
    except urllib.error.HTTPError as e:
        b=e.read();return e.code,b if raw else json.loads(b or b'null')
phase=sys.argv[1]
for u in users:
    if 'token' not in u:
        s,d=call('/auth/v1/token?grant_type=password',{'email':u['email'],'password':u['password']})
        assert s==200, ('login failed',s,d.get('msg'))
        u['token']=d['access_token']
auth.write_text(json.dumps(users))
for idx,u in enumerate(users):
    visible=phase=='sent' and idx==0
    for table,query in [('event_contracts','event_id=eq.'+event),('event_documents','id=eq.'+doc)]:
        s,d=call('/rest/v1/'+table+'?select=id&'+query,token=u['token'])
        assert s==200 and len(d)==int(visible),(phase,idx,table,s)
    s,d=call('/storage/v1/object/sign/event-documents/'+path,{'expiresIn':60},u['token'])
    if visible:
        assert s==200 and 'signedURL' in d,(phase,s)
        req=urllib.request.Request(url+'/storage/v1'+d['signedURL'])
        with urllib.request.urlopen(req,timeout=60) as r: pdf=r.read()
        assert hashlib.sha256(pdf).hexdigest()=='e304d882c72d10b1f324fc5420969f605de23e7adfe888de3777d215cf7ffc91'
        print('PASS sent owner signed download:',len(pdf),'bytes SHA256',hashlib.sha256(pdf).hexdigest())
    else:
        assert s in (400,403,404) and 'signedURL' not in d,(phase,idx,s)
    s,d=call('/storage/v1/object/authenticated/event-documents/'+path,token=u['token'],raw=True)
    assert (s==200)==visible,(phase,idx,'direct',s)
    if visible:
        assert hashlib.sha256(d).hexdigest()=='e304d882c72d10b1f324fc5420969f605de23e7adfe888de3777d215cf7ffc91'
    print('PASS',phase,'client',idx,'metadata/sign/direct', 'allowed' if visible else 'blocked')
s,d=call('/storage/v1/object/public/event-documents/'+path,raw=True)
assert s in (400,403,404) and not d.startswith(b'%PDF')
print('PASS public access blocked',s)
