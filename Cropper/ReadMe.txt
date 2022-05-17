*** Test Code ***

Quite often when creating a new project you want some simple test code to ensure your installation is correct.

First you need to ensure you are using the correct namespace. Insert the following at the top of your C# module.

	using WebSupergoo.WordGlue3;

If you are in a forms or console application, the following conversion code may be useful.

	using(var doc = new Doc(@"c:\test.docx"))
            doc.SaveAs(@"c:\output.pdf");





*** Deployment ***

WordGlue is an Xcopy deployment. All that is needed is that the WordGlue DLL file be copied to your bin directory. This will happen automatically because it is what is specified in the NuGet installer. 

However if you deploy in this way to another machine, the license is not copied. So if you push your bin directory up to a machine in the cloud, you need to ensure that it gets a copy of your license.

To do this you can use the Settings.InstallLicense call in your code. This should be called before any WordGlue objects are created, passing your purchased license key or, if you have not yet purchased, your trial license key.

To get your trial license key you will need to copy it out of WGSettings.exe which is in the NuGet installation directory - typically at a location like "C:\Users\JohnSmith\.nuget\packages\wordglue\3.0.0\WGSettings\WGSettings.exe".

However if you are reading this text file in Visual Studio, just right click on the 'ReadMe.txt' tab at the top of the window and select 'Open Containing Folder'. This will get you to roughly the right place - you'll just need to step up a few directories.



