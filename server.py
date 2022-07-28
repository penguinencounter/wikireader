from flask import Flask, request
import portal

app = Flask(__name__)


@app.route('/guess_api')
def guess_api():
    return portal.guess_api_endpoint(request)


app.run(host='0.0.0.0', port=8080, debug=True)
