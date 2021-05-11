#!/bin/bash

# This script is used to re-create the release for the pre-built UI assets
# for the OSS Master release. It will build the UI assets, add them to a tar,
# and upload them to the release, deleting the previous release of the same name
# in the process.
#
# This script should be run from the root of the repository. It requires
# having a GITHUB_TOKEN environment variable set, and also requires Go and yarn.

yarn install && yarn build
mkdir -p release
tar -czvf release/build.tar.gz ./build
cd release && shasum -a 256 build.tar.gz >> sha256.txt && cd ../
GO111MODULE=on go get -u github.com/tcnksm/ghr@v0.13.0
ghr \
  -t ${GITHUB_TOKEN} \
  -u wbaker85 \
  -r test-build \
  -c ${CIRCLE_SHA1}
  -n "OSS Master UI" \
  -b "Pre-built UI assets for the OSS Master Branch." \
  -recreate \
  ${RELEASE_TAG} \
  release
