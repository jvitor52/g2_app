del /f /q input.apk
del /f /q output.apk

copy platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk input.apk

SET JAVA_HOME=C:\Program Files\Java\jdk-18.0.1.1\
SET PATH=%PATH%;C:\Program Files\Java\jre-9.0.4\bin;C:\Program Files\Java\jdk-18.0.1.1\bin;C:\Users\User\AppData\Local\Android\Sdk\build-tools\30.0.0

zipalign -f -v 4 input.apk output.apk

REM jarsigner -verbose -keystore input.keystore -sigalg SHA256withRSA -digestalg SHA-256 -storepass ANI4n14n1$ -keypass ANI4n14n1$ input.apk alias_name

apksigner sign --ks input.keystore --ks-key-alias alias_name --ks-pass pass:ANI4n14n1$ --key-pass pass:ANI4n14n1$ --v1-signing-enabled true --v2-signing-enabled true output.apk

REM zipalign -c -v 4 output.apk

pause