from os import walk
import boto3
import sys


def getContentType(key):
    if '.html' in key:
        return 'text/html'
    if '.js' in key:
        return 'application/javascript'
    if '.png' in key:
        return 'image/png'
    if '.xml' in key:
        return 'text/xml'


s3 = boto3.client('s3')
bucket_name = 'caverns-of-gink-mobile-dev'

key = sys.argv[1]

s3.upload_file(key, bucket_name, key, ExtraArgs={
    'ACL':'public-read',
    'ContentType' : getContentType(key)
})
