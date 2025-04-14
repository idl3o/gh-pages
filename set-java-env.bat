@echo off
REM Set Java environment variables for VS Code

REM Configure Java paths to standard installation locations
set JAVA_HOME_8=C:\Program Files\Java\jdk-24
REM Configure Java 11 (use JDK 24 since it's what we have)
set JAVA_HOME_11=C:\Program Files\Java\jdk-24
REM Configure Java 17 (use JDK 24 since it's what we have)
set JAVA_HOME_17=C:\Program Files\Java\jdk-24
REM Configure Java 23 (use JDK 24 since it's what we have)
set JAVA_HOME_23=C:\Program Files\Java\jdk-24

REM Set current JAVA_HOME to Java 24
set JAVA_HOME=%JAVA_HOME_17%
set PATH=%JAVA_HOME%\bin;%PATH%

REM Verify Java setup
echo Current Java setup:
java -version

echo.
echo Environment variables set:
echo JAVA_HOME=%JAVA_HOME%
echo JAVA_HOME_8=%JAVA_HOME_8%
echo JAVA_HOME_11=%JAVA_HOME_11%
echo JAVA_HOME_17=%JAVA_HOME_17%
echo JAVA_HOME_23=%JAVA_HOME_23%

REM Launch VS Code with proper environment
code .
