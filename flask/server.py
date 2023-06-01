import tempfile
import pandas as pd
from pandas.core.api import DataFrame
import json
from flask import Flask, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from decisionTree import csvDataFrameToDecisionTree

server = Flask(__name__)
CORS(server)

# mssql connection setting
f = open("mssql.json")
jos = json.load(f)
f.close()
conf = jos[0]["local"]
drv = conf["driver"]
uid = conf["uid"]
pwd = conf["pwd"]
srv = conf["server"]
ins = conf["instance"]
pno = conf["port"]
db = conf["db"]
str = f"mssql+pyodbc://{uid}:{pwd}@{srv}{ins}:{pno}/{db}?driver={drv}"
print(str)
db = create_engine(str, fast_executemany=True)


def dataToSQL(data: DataFrame, lastID="0"):
    print(data)
    df = pd.DataFrame(data)
    df.to_sql("D" + lastID, db, if_exists="replace", index=False, schema="dbo")


@server.route("/api/uploadCsv", methods=["POST"])
def uploadCsv():
    lastID = request.form["lastID"]
    print(lastID)
    if request.files:
        csvFile = request.files["file"]
        tempFile = tempfile.NamedTemporaryFile(delete=False)
        csvFile.save(tempFile.name)
        with open(tempFile.name, "rb") as f:
            print(csvFile)
            data = pd.read_csv(f, encoding="utf-8")
            dataToSQL(data, lastID)
    elif request.form["url"]:
        url = request.form["url"]
        print(url)
        data = pd.read_csv(url, encoding="utf-8")
        dataToSQL(data, lastID)

    return "upload csv successfully"


@server.route("/api/decisionTree", methods=["GET"])
def decisionTree():
    result = db.execute(
        text("select * from RawDB.dbo.D" + request.args.get("oid")))
    df = pd.DataFrame(result.fetchall(), columns=result.keys())
    result = csvDataFrameToDecisionTree(
        df, request.args.get("target"),
        request.args.get("features").split(","))
    return json.dumps(result)


if __name__ == "__main__":
    server.run(debug=True, host="localhost", port=3090)
