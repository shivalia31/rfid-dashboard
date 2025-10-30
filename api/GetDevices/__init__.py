import azure.functions as func
import json
import os
from azure.cosmos import CosmosClient

COSMOS_CONN = os.environ.get("COSMOS_CONNECTION_STRING")
DATABASE_NAME = "rfid_demo_db"
DEVICES_CONTAINER = "devices"

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        if not COSMOS_CONN:
            raise ValueError("Missing COSMOS_CONNECTION_STRING in settings.")

        client = CosmosClient.from_connection_string(COSMOS_CONN)
        database = client.get_database_client(DATABASE_NAME)
        container = database.get_container_client(DEVICES_CONTAINER)

        items = list(container.query_items(
            query="SELECT * FROM c",
            enable_cross_partition_query=True
        ))

        return func.HttpResponse(
            json.dumps(items, default=str),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)
