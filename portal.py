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


def guess_api_endpoint(req: flask.Request) -> typing.Union[flask.Response, str]:
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
                'result': modified.geturl()
            }
            site_api_cache[std] = result.copy()
            result['cached'] = False
            return result
    return generate_error_response(404, 'Could not find api endpoint :(')
