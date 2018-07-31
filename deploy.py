from os import walk
import boto3


def getContentType(key):
    if '.html' in key:
        return 'text/html'
    if '.js' in key:
        return 'application/javascript'
    if '.png' in key:
        return 'image/png'
    if '.xml' in key:
        return 'text/xml'


def getFilesByTypes(folder, filetype):
    for (dirpath, dirnames, filenames) in walk(folder):
        keys = map(lambda x: folder + '/' + x, filenames)
        keys = filter(lambda x: filetype in x, keys)
        return keys


s3 = boto3.client('s3')
bucket_name = 'caverns-of-gink-mobile-dev'

objects = s3.list_objects(Bucket=bucket_name)
if 'Contents' in objects:
    contents = objects['Contents']
    for key in contents:
        s3.delete_object(Bucket=bucket_name, Key=key['Key'])

all_keys = ['index.html', 'phaser.min.js']
all_keys.extend(getFilesByTypes('js', '.js'))
all_keys.extend(getFilesByTypes('levels', '.xml'))
all_keys.extend(getFilesByTypes('assets', '.png'))
all_keys.extend(getFilesByTypes('assets', '.json'))
all_keys.extend(getFilesByTypes('assets/fonts', '.xml'))
all_keys.extend(getFilesByTypes('assets/fonts', '.png'))

for key in all_keys:
    s3.upload_file(key, bucket_name, key, ExtraArgs={
        'ACL':'public-read',
        'ContentType' : getContentType(key)
    })

# Create the configuration for the website
website_configuration = {
    'IndexDocument': {'Suffix': 'index.html'},
}

# Set the new policy on the selected bucket
s3.put_bucket_website(
    Bucket = bucket_name,
    WebsiteConfiguration = website_configuration
)

