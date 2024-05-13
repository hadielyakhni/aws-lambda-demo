import json
import random

def lambda_handler(event, context):
    # TODO implement
    json_file = 'Thoughts.json'
    with open(json_file, 'r') as f:
        quotes = json.load(f)

    quote_number = random.randint(0, len(quotes)-1)
    print(quotes[quote_number]['quote'])

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }