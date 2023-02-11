del /f /q input.aab
del /f /q output.aab

copy platforms\android\app\build\outputs\bundle\release\app-release.aab input.aab

SET JAVA_HOME=C:\Program Files\Java\jdk-11.0.16\
SET PATH=%PATH%;C:\Program Files\Java\jre-9.0.4\bin;C:\Program Files\Java\jdk-18.0.1.1\bin;C:\Program Files\Java\jdk-11.0.16\bin;C:\Users\User\AppData\Local\Android\Sdk\build-tools\30.0.0

jarsigner -verbose -keystore input.keystore -sigalg SHA256withRSA -digestalg SHA-256 -storepass ANI4n14n1$ -keypass ANI4n14n1$ input.aab alias_name

zipalign -f -v 4 input.aab output.aab

zipalign -c -v 4 output.aab

pause