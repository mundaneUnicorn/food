foodcrawl
=====================
A web app which which displays a number of restaurants along the route to a destination.  
Users can save addresses for later use and filter the displayed restaurants.  
Utilizes the MEAN stack.

## Installation

npm install  
TO READY FOR DEPLOYMENT: Delete --watch from package.json line 9, add "node run compile && " to "start script", 
and remove "key.js" from .gitignore


## Running the Server

mongod  
npm start
at 127.0.0.1:8000

## Testing

npm test

## API Reference

https://www.yelp.com/developers/documentation/v2/overview  
https://developers.google.com/maps/

## Contributors

* Justin Griffin
* Eric Zolayvar
* Alex Pattison
* Christopher Chiang

## License

MIT License

Copyright (c) 2016 mundaneUnicorn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
