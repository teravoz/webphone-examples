# webphone-examples

This repository contains two examples using the Teravoz WebRTC library. 

The source code can be found at examples/ path.

## Examples

### floating-phone

It implements the UI of a webphone that can be dragged around the window. This example
stands for a dynamic and flexible webphone on your screen. It may be embedded in a CRM.

  * How to run ?

    - Open the examples/floating-phone/index.html file

    - Place your API-KEY **(check the Teravoz docs) on the embed script

    - Go to examples/floating-phone/assets/js/main.js line 69

    - Insert your peer credentials
    
    - Execute the following commands in the bash:

    ```shell
      docker build . -t webphone-examples

      docker run -d --net host webphone-examples
    ```

    - Access the address http://localhost:3068/floating-phone

### using-dialpad

It also implements the UI of a webphone using a dialpad. This example
stands for a more complex way to build an UI using the WebRTC Teravoz Library. 

  * How to run ?

    - Open the examples/floating-phone/index.html file

    - Place your API-KEY [(Teravoz API Documentation)](https://developers.teravoz.com.br/#webrtc) on the embed script

    - Execute the following commands in the bash:

    ```shell
      docker build . -t webphone-examples

      docker run -d --net host webphone-examples
    ```

    - Access the address http://localhost:3068/using-dialpad

## Important Notes

Those examples are only starting points to build your own UI using the WebRTC Teravoz Library, meaning that it should NOT be used in production environments.



