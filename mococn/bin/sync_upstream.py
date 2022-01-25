#!/usr/bin/env python

import io
import os
import shutil
import sys
import zipfile

import requests

def save_url_locally(url, local_file):
    print(f"Downloading {url} to {local_file}")
    response = requests.get(url)
    response.raise_for_status()
    with open(local_file, "wb") as f:
        f.write(response.content)

def main(repo, tag):
    url = f"https://hg.mozilla.org/releases/{repo}/archive/{tag}.zip/browser/components/newtab/"
    print(f"Downloading {url}")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    archive = zipfile.ZipFile(io.BytesIO(response.content))
    entries = sorted(set(name.split("/")[4] for name in archive.namelist()))
    for entry in entries:
        if os.path.isdir(entry):
            print(f"Removing dir {entry}")
            shutil.rmtree(entry)
        elif os.path.isfile(entry):
            print(f"Removing file {entry}")
            os.remove(entry)
        elif not os.path.exists(entry):
            print(f"{entry} doesn't exist")
        else:
            print(f"??? {entry} ???")
    archive.extractall("temp")
    for entry in entries:
        os.rename(f"temp/{repo}-{tag}/browser/components/newtab/{entry}", entry)
    shutil.rmtree("temp")

    for remote_file, local_file in [ 
        ("browser/base/content/contentTheme.js", "gecko-dev/contentTheme.js"),
        ("browser/branding/official/locales/en-US/brand.ftl", "gecko-dev/l10n/en-US/brand.ftl"),
        ("browser/components/search/content/contentSearchHandoffUI.js", "gecko-dev/contentSearchHandoffUI.js"),
        ("browser/components/search/content/contentSearchUI.js", "gecko-dev/contentSearchUI.js"),
        ("browser/locales/en-US/browser/branding/brandings.ftl", "gecko-dev/l10n/en-US/brandings.ftl"),
        ("browser/locales/en-US/browser/newtab/newtab.ftl", "gecko-dev/l10n/en-US/newtab.ftl"),
    ]:
        url = f"https://hg.mozilla.org/releases/{repo}/raw-file/{tag}/{remote_file}"
        save_url_locally(url, local_file)

    response = requests.get(f"https://hg.mozilla.org/releases/{repo}/raw-file/{tag}/browser/locales/l10n-changesets.json")
    response.raise_for_status()
    zh_cn_rev = response.json().get("zh-CN", {}).get("revision", "tip")
    for remote_file, local_file in [
        ("browser/branding/official/brand.ftl", "gecko-dev/l10n/zh-CN/brand.ftl"),
        ("browser/browser/branding/brandings.ftl", "gecko-dev/l10n/zh-CN/brandings.ftl"),
        ("browser/browser/newtab/newtab.ftl", "gecko-dev/l10n/zh-CN/newtab.ftl"),
    ]:
        url = f"https://hg.mozilla.org/l10n-central/zh-CN/raw-file/{zh_cn_rev}/{remote_file}"
        save_url_locally(url, local_file)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        exit("Which repo & which tag?")
    main(sys.argv[1], sys.argv[2])
