import boto3
import time
import json

athena = boto3.client('athena')

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    DATABASE = "db_cost_sentinel" 
    S3_OUTPUT = "s3://athena-query-results-v1-danilo/" 

    query = """
    SELECT 
        product_code,           
        region,                 
        operation,              
        usage_type,             
        "sum_usage_amount_#0",  
        unit,                   
        usage_start_date,       
        "sum_unblended_cost_#0"
    FROM "banco"."tabela"
    ORDER BY usage_start_date ASC
    """
    
    try:
        response = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': DATABASE},
            ResultConfiguration={'OutputLocation': S3_OUTPUT}
        )
        query_id = response['QueryExecutionId']

        status = 'RUNNING'
        while status in ['RUNNING', 'QUEUED']:
            res = athena.get_query_execution(QueryExecutionId=query_id)
            status = res['QueryExecution']['Status']['State']
            if status == 'FAILED':
                reason = res['QueryExecution']['Status'].get('StateChangeReason', 'Athena Error')
                return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': reason})}
            time.sleep(1)

        results = athena.get_query_results(QueryExecutionId=query_id)
        data = []
        
        for row in results['ResultSet']['Rows'][1:]:
            
            def get_v(i): 
                val = row['Data'][i].get('VarCharValue', '0')
                return val if val != 'null' else '0'

            try:
                data.append({
                    "service": get_v(0),
                    "region": get_v(1),
                    "operation": get_v(2),     
                    "usage_type": get_v(3),
                    "amount": get_v(4),
                    "unit": get_v(5),
                    "date": get_v(6),
                    "cost": float(get_v(7))    
                })
            except ValueError:
                continue

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'results': data,
                'total_monthly': round(sum(item['cost'] for item in data), 2)
            })
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}