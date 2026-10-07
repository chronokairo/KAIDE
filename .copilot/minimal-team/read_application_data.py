"""Server-side scoped reader for structured datasets in the existing inventory."""
import argparse, hashlib, json
from pathlib import Path
from sync_knowledge import Backend, configuration
from materialize_knowledge import ResilientBackend
from import_person_leads import classify

def iter_crm_leads(backend,organization_id,market):
    if market not in {'B2B','B2C'}:raise ValueError('Invalid lead market')
    rows=backend.call('GET','/rest/v1/leads?organization_id=eq.'+organization_id+'&select=*&limit=1000')
    for row in rows:
        if row['organization_id']!=organization_id:raise ValueError('Lead organization mismatch')
        if classify(row)==market:yield row

def iter_application_records(backend,organization_id,application):
    inventories=backend.call('GET','/rest/v1/data_inventory?organization_id=eq.'+organization_id+'&select=id,purpose&limit=1000')
    for inventory in inventories:
        try:descriptor=json.loads(inventory.get('purpose') or '')
        except (ValueError,TypeError):continue
        if descriptor.get('version')!=1 or descriptor.get('application')!=application:continue
        if descriptor.get('organization_id')!=organization_id:raise ValueError('Dataset organization mismatch')
        for part in descriptor['parts']:
            if not part['key'].startswith(organization_id+'/application-data/'):raise ValueError('Object outside organization scope')
            raw=backend.call('GET','/storage/v1/object/'+descriptor['bucket']+'/'+part['key'],raw=True)
            if hashlib.sha256(raw).hexdigest()!=part['sha256']:raise ValueError('Dataset checksum mismatch')
            for line in raw.splitlines():yield json.loads(line)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--env-file',type=Path,required=True);parser.add_argument('--project-ref',required=True);parser.add_argument('--organization-id',required=True);parser.add_argument('--application',required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    url,key=configuration(args.env_file,args.project_ref);b=ResilientBackend(url,key,'chronokairo-knowledge');count=0
    with args.output.open('w',encoding='utf8') as f:
        rows=iter_crm_leads(b,args.organization_id,args.application.removeprefix('crm-').upper()) if args.application in {'crm-b2b','crm-b2c'} else iter_application_records(b,args.organization_id,args.application)
        for row in rows:f.write(json.dumps(row,ensure_ascii=False)+'\n');count+=1
    print(json.dumps({'records':count,'application':args.application}))
if __name__=='__main__':main()
