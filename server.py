from flask import Flask, request, redirect, abort
import portal

app = Flask(__name__)


@app.route('/guess_api')
def guess_api():
    return portal.guess_api_endpoint(request)


@app.route('/portal/<int:site_id>/do')
def do(site_id):
    return portal.action(site_id, request)


@app.route('/')
def index():
    return redirect('/static/index.html')


# Yes, this is required for the client to use the server.
@app.route('/is_there_a_server_here')
def is_there_a_server_here():
    return 'Yes, silly!'



app.run(host='0.0.0.0', port=8080, debug=True)
