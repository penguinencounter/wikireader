# Portal
# provides access to API endpoints and some other tools


from typing import Any
import typing
import flask
from urllib.parse import urlparse

import requests


def require_param(req: flask.Request, name: str) -> Any:
    """
    Checks if a parameter is present in the request.
    :param req: flask request
    :param name: parameter name
    :return: True if parameter is present, False otherwise
    """
    return req.args[name] if name in req.args else None


def generate_error_response(error_code: int, error_message: str) -> flask.Response:
    return flask.make_response({
        'ok': False,
        'error': {
            'code': error_code,
            'message': error_message
        }
    }, error_code)


site_api_cache = {}
site_id_cache = {}


def get_id_for_addr(target_url: str) -> int:
    global site_id_cache
    if target_url in site_id_cache:
        return site_id_cache[target_url]
    # assign a new id
    new = len(site_id_cache)
    site_id_cache[new] = target_url
    return new


GLOBAL_USER_AGENT = 'WikiReader-Portal/0.1 (en:PenguinEncounter2 miles.h.lin(at)gmail.com) <Source: {ua}, ip: {ip}> python-requests/2.28.1'


def action(site_id: int, req: flask.Request) -> flask.Response:
    global site_id_cache
    if site_id not in site_id_cache:
        return generate_error_response(404, 'Bad site id')
    target_url = site_id_cache[site_id]
    # mirror the request to the target url (query params)
    heads = {
        'User-Agent': GLOBAL_USER_AGENT.format(ua=req.user_agent, ip=req.remote_addr)
    }
    print('mirroring request to: ' + target_url)
    print('ua is: ' + heads['User-Agent'])
    r = requests.request(req.method, target_url, params=req.args, headers=heads)  # Should be enough?
    resp = flask.make_response(r.content)
    resp.mimetype = r.headers['Content-Type']
    return resp


def guess_api_endpoint(req: flask.Request) -> flask.Response:
    global site_api_cache
    site = require_param(req, 'site')
    if site is None:
        return generate_error_response(400, 'Missing site parameter')
    # Parse me a url
    url = urlparse(site)
    # Require that the scheme is http or https
    # Require that netloc is not empty
    # Require that path is empty or '/'
    # and everything else is empty
    if url.scheme not in ['http', 'https']:
        return generate_error_response(400, 'Invalid scheme for url: ' + url.scheme + ' (expected http or https)')
    if url.netloc == '':
        return generate_error_response(400, 'Domain target was blank')
    if url.path != '' and url.path != '/':
        return generate_error_response(400, 'Invalid path for url: ' + url.path + " (must be empty or '/')")
    if url.query != '':
        return generate_error_response(400, 'Invalid query for url: ' + url.query + " (must be empty)")
    if url.fragment != '':
        return generate_error_response(400, 'Invalid fragment for url: ' + url.fragment + " (must be empty)")
    
    # Check if we have a cached result
    # (standardize url)
    std = url._replace(path='').geturl()
    if std in site_api_cache:
        from_cache = site_api_cache[std]
        from_cache['cached'] = True
        return from_cache

    # on Wikimedia Foundation wikis, the api is at /w/api.php (or similar)
    # on some other wikis (like Minecraft), the api is at /api.php (or similar)
    TEST_TARGET_ENDPOINTS = [
        '/w/api.php',
        '/api.php'
    ]
    for endpoint in TEST_TARGET_ENDPOINTS:
        # ... and make a request to the endpoint (use requests)
        # if the request is successful, return the url
        # if the request is not successful, continue
        # if all requests fail, return an error
        modified = url._replace(path=endpoint)
        sub_request = requests.get(modified.geturl())

        if sub_request.status_code == 200:
            print('new endpoint to cache: ' + modified.geturl())
            result = {
                'ok': True,
                'result': modified.geturl(),
                'id': get_id_for_addr(modified.geturl())
            }
            site_api_cache[std] = result.copy()
            result['cached'] = False
            return result
    return generate_error_response(404, 'Could not find api endpoint :(')
