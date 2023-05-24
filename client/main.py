#
# Client-side python app for photoapp, this time working with
# web service, which in turn uses AWS S3 and RDS to implement
# a simple photo application for photo storage and viewing.
#
# Project 02 for CS 310, Spring 2023.
#
# Authors:
#   YOUR NAME
#   Prof. Joe Hummel (initial template)
#   Northwestern University
#   Spring 2023
#

import requests  # calling web service
import jsons  # relational-object mapping

import uuid
import pathlib
import logging
import sys
import os
import base64

from configparser import ConfigParser

import matplotlib.pyplot as plt
import matplotlib.image as img


###################################################################
#
# classes
#
class User:
  userid: int  # these must match columns from DB table
  email: str
  lastname: str
  firstname: str
  bucketfolder: str


class Asset:
  userid: int  # these must match columns from DB table
  asset_name: str
  bucket_key: str
  data: str


class Download:
  asset_id: int  # these must match columns from DB table
  user_id: int
  asset_name: str
  bucket_key: str


class BucketItem:
  Key: str  # these must match columns from DB table
  LastModified: str
  ETag: str
  Size: int
  StorageClass: str


###################################################################
#
# prompt
#
def prompt():
  """
  Prompts the user and returns the command number
  
  Parameters
  ----------
  None
  
  Returns
  -------
  Command number entered by user (0, 1, 2, ...)
  """
  print()
  print(">> Enter a command:")
  print("   0 => end")
  print("   1 => stats")
  print("   2 => users")
  print("   3 => assets")
  print("   4 => download")
  print("   5 => download and display")
  print("   6 => bucket contents")
  # with open('photo1.jpeg', 'rb') as f:
  #   B = f.read()
  # E = base64.b64encode(B)
  # print(E)
  # D = E.decode()
  # print(D)

  cmd = int(input())
  return cmd

  
  


###################################################################
#
# stats
#
def stats(baseurl):
  """
  Prints out S3 and RDS info: bucket status, # of users and 
  assets in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/stats'
    url = baseurl + api

    res = requests.get(url)
    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract stats:
    #
    body = res.json()
    #
    print("bucket status:", body["message"])
    print("# of users:", body["db_numUsers"])
    print("# of assets:", body["db_numAssets"])

  except Exception as e:
    logging.error("stats() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


###################################################################
#
# users
#
def users(baseurl):
  """
  Prints out all the users in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/users'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract users:
    #
    body = res.json()
    #
    # let's map each dictionary into a User object:
    #
    users = []
    for row in body["data"]:
      user = jsons.load(row, User)
      users.append(user)
    #
    # Now we can think OOP:
    #

    for user in users:
      print(user.userid)
      print(" ", user.email)
      print(" ", user.lastname, ",", user.firstname)
      print(" ", user.bucketfolder)

  except Exception as e:
    logging.error("users() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#######################################################
def assets(baseurl):

  try:

    api = '/assets'
    url = baseurl + api

    res = requests.get(url)

    if res.status_code != 200:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:
        body = res.json()
        print("Error message:", body["message"])
      return

    body = res.json()

    assets = []
    for row in body["data"]:
      asset = jsons.load(row, Asset)
      assets.append(asset)

    for asset in assets:
      print(asset.assetid)
      print(" ", asset.userid)
      print(" ", asset.assetname)
      print(" ", asset.bucketkey)

  except Exception as e:
    logging.error("users() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#########################################################################


def download(baseurl):
  print("Enter asset id> ")
  try:
    api = '/download'
    assetId = str(input())
    url = baseurl + api + "/" + assetId
    res = requests.get(url)

    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      return

    body = res.json()

    download = jsons.load(body, Download)

    if download.user_id == -1:
      body = res.json()
      print(body["message"])
      return

    
    image = base64.b64decode(download.data)
    outfile = open(download.asset_name, "wb")
    outfile.write(image)

    print("userid: ", download.user_id)
    print("asset name: ", download.asset_name)
    print("bucket key: ", download.bucket_key)
    print("Downloaded from S3 and saved as '", download.asset_name, "\'")

  except Exception as e:
    logging.error("download() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#########################################################################


def showImage(baseurl):
  print("Enter asset id> ")
  try:
    api = '/download'
    assetId = str(input())
    url = baseurl + api + "/" + assetId
    res = requests.get(url)

    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      return

    body = res.json()

    download = jsons.load(body, Download)

    if download.user_id == -1:
      body = res.json()
      print(body["message"])
      return

    
    image = base64.b64decode(download.data)
    outfile = open(download.asset_name, "wb")
    outfile.write(image)

    print("userid: ", download.user_id)
    print("asset name: ", download.asset_name)
    print("bucket key: ", download.bucket_key)
    print("Downloaded from S3 and saved as '", download.asset_name, "\'")

    image = img.imread(download.asset_name)

    plt.imshow(image)
    plt.show()

  except Exception as e:
    logging.error("download() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#########################################################################


def bucket(baseurl):
  startafter = ""

  while True:
    try:
      api = "/bucket?startafter=" + startafter
      url = baseurl + api
      res = requests.get(url)

      if res.status_code == 400:
        body = res.json()
        print(body["message"])
        return

      elif res.status_code != 200:
        # failed:
        print("Failed with status code:", res.status_code)
        print("url: " + url)
        return
      body = res.json()

      buckets = []
      for row in body["data"]:
        bucket = jsons.load(row, BucketItem)
        buckets.append(bucket)

      if len(buckets) == 0:
        break

      for bucket in buckets:
        print(bucket.Key)
        print(" ", bucket.LastModified)
        print(" ", bucket.Size)

    except Exception as e:
      logging.error("users() failed:")
      logging.error("url: " + url)
      logging.error(e)
      return

    startafter = buckets[-1].Key

    print("another page? [y/n]")
    s = input()

    if s != "y":
      break


#########################################################################


def user(baseurl):

    try:
      url = 'https://project-02-server-linyunchang.cs-310-spring-2023.repl.co/user'

      data = {
        "email" : "pooja@piazza.com",
        "last name" : "sarker",
        "first name" : "pooja"
        
      }
      res = requests.put(url, json = data)

      if res.status_code == 400:
        body = res.json()
        print(body["message"])
        return

      elif res.status_code != 200:
        # failed:
        print("Failed with status code:", res.status_code)
        print("url: " + url)
        return
      body = res.json()


    except Exception as e:
      logging.error("users() failed:")
      logging.error("url: " + url)
      logging.error(e)
      return

#################################################################
# main
#
print('** Welcome to PhotoApp v2 **')
print()

# eliminate traceback so we just get error message:
sys.tracebacklimit = 0

#
# what config file should we use for this session?
#
config_file = 'photoapp-client-config'

print("What config file to use for this session?")
print("Press ENTER to use default (photoapp-config),")
print("otherwise enter name of config file>")
s = input()

if s == "":  # use default
  pass  # already set
else:
  config_file = s

#
# does config file exist?
#
if not pathlib.Path(config_file).is_file():
  print("**ERROR: config file '", config_file, "' does not exist, exiting")
  sys.exit(0)

#
# setup base URL to web service:
#
configur = ConfigParser()
configur.read(config_file)
baseurl = configur.get('client', 'webservice')

# print(baseurl)

#
# main processing loop:
#
cmd = prompt()

while cmd != 0:
  #
  if cmd == 1:
    stats(baseurl)
  elif cmd == 2:
    users(baseurl)
  elif cmd == 3:
    assets(baseurl)
  elif cmd == 4:
    download(baseurl)
  elif cmd == 5:
    showImage(baseurl)
  elif cmd == 6:
    bucket(baseurl)
  elif cmd == 7:
    user(baseurl)
  else:
    print("** Unknown command, try again...")
  #
  cmd = prompt()

#
# done
#
print()
print('** done **')
