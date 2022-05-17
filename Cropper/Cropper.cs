
using DocumentFormat.OpenXml.Packaging;
//using Microsoft.Office.Interop.Word;
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using WebSupergoo.WordGlue3;
using WebSupergoo.WordGlue3.Layout;

namespace Cropper
{
    public class Cropper
    {

        static void ParseAsync(string path, string outputPath)
        {

            SautinSoft.PdfMetamorphosis p = new SautinSoft.PdfMetamorphosis();

            p.DocToPdfConvertFile(path, outputPath);
            
            //using (Doc doc = new Doc(path))
            //{
            //    ParagraphFrame paragraphFrame = new ParagraphFrame();
            //    doc.DocumentFrame.Scan(a =>
            //    {
            //        if(a is ParagraphFrame)
            //        {
            //            paragraphFrame = a as ParagraphFrame;
            //        }
            //    });
            //    TextRunFrame run = new TextRunFrame();
            //    paragraphFrame.Scan(a => {
            //        if(a is TextRunFrame)
            //        {
            //            run = a as TextRunFrame;
            //        }
            //    });
            //    run.StyleStore.Entries["FontSize"] = "12";
            //    run.StyleStore.Entries["FontFamily"] = "Times New Roman";
            //    doc.SaveAs(outputPath);
            //}
            //    Document document = new Document(path);
            //DocumentBuilder builder = new DocumentBuilder(document);
            //builder.Font.Name = "Times New Roman";
            //builder.Write(document.GetText());
            //PdfSaveOptions pso = new PdfSaveOptions();
            //pso.Compliance = PdfCompliance.Pdf17;
            //document.Save(outputPath, pso);

            //    object oMissing = System.Reflection.Missing.Value;
            //    Application word = new Application();
            //    Object filename = (Object)path;
            //    Document doc = word.Documents.Open(ref filename, ref oMissing,
            //ref oMissing, ref oMissing, ref oMissing, ref oMissing, ref oMissing,
            //ref oMissing, ref oMissing, ref oMissing, ref oMissing, ref oMissing,
            //ref oMissing, ref oMissing, ref oMissing, ref oMissing);
            //    try
            //    {


            //        object outputFileName;

            //        object fileFormat = WdSaveFormat.wdFormatPDF;
            //        outputFileName = outputPath.Replace(".doc", ".pdf");
            //        doc.Content.Font.Size = 12;

            //        doc.Content.Font.Name = "Times New Roman";


            //        doc.SaveAs(ref outputFileName,
            //   ref fileFormat, ref oMissing, ref oMissing,
            //   ref oMissing, ref oMissing, ref oMissing, ref oMissing,
            //   ref oMissing, ref oMissing, ref oMissing, ref oMissing,
            //   ref oMissing, ref oMissing, ref oMissing, ref oMissing);

            //        object saveChanges = WdSaveOptions.wdSaveChanges;
            //        ((_Document)doc).Close(ref saveChanges, ref oMissing, ref oMissing);
            //        doc = null;

            //        ((_Application)word).Quit(ref oMissing, ref oMissing, ref oMissing);
            //        word = null;

            //        return outputFileName.ToString();
            //    }
            //    catch (Exception e)
            //    {

            //        object saveChanges = WdSaveOptions.wdDoNotSaveChanges;
            //        ((_Document)doc).Close(ref saveChanges, ref oMissing, ref oMissing);
            //        doc = null;

            //        ((_Application)word).Quit(ref oMissing, ref oMissing, ref oMissing);
            //        word = null;
            //    }
            //    return "";
        }
        public static string CropImage(byte[] file)
        {
            string result = "";
            string InputDoc = "C:\\test4.docx", OutputPdf = "C:\\test4.pdf", output = "C:\\test";
            File.WriteAllBytes(InputDoc, file);

            SautinSoft.PdfMetamorphosis p = new SautinSoft.PdfMetamorphosis();
            p.TextSettings.FontSize = 12;
            p.TextSettings.FontFace.TimesNewRoman();
            int ConvertResult = p.DocxToPdfConvertFile(InputDoc, OutputPdf);
            //ParseAsync("C:\\test4.doc", input);



            string ghostScriptPath = @"E:\Old\gs9.50\bin\gswin64.exe";
            //string ghostScriptPath = @"C:\Program Files\gs\gs9.50\bin";
            String ars = "-dNOPAUSE -sDEVICE=jpeg -r300 -o  " + output + ".jpg -sPAPERSIZE=a4 " + OutputPdf;
            Process proc = new Process();
            proc.StartInfo.FileName = ghostScriptPath;
            proc.StartInfo.Arguments = ars;
            proc.StartInfo.CreateNoWindow = true;
            proc.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
            proc.Start();
            proc.EnableRaisingEvents = true;
            if (!proc.WaitForExit(4000))
            {
                proc.CloseMainWindow();
                proc.Close();
                if (!proc.WaitForExit(4000))
                {
                    proc.Kill();
                }
            }
            int maxHeight = 0;
            using (Image img1 = Image.FromFile(output + ".jpg"))
            {
                using (Bitmap bmp = new Bitmap(img1))
                {

                    LockBitmap bmp1 = new LockBitmap(bmp);
                    bmp1.LockBits();
                    int step = bmp1.Depth == 32 ? 4 : bmp1.Depth == 24 ? 3 : 1;
                    for (int i = bmp1.Width * bmp1.Height; i >= 0; i -= step)
                    {
                        if (bmp1.Pixels[i] != 255)
                        {
                            maxHeight = i;
                            break;
                        }
                    }
                    maxHeight = (int)Math.Ceiling((double)(maxHeight / bmp1.Width));
                    if (maxHeight + 30 <= bmp1.Height)
                    {
                        maxHeight += 30;
                    }
                    Bitmap cropBmp = bmp.Clone(new System.Drawing.Rectangle(0, 0, bmp.Width, maxHeight), bmp.PixelFormat);
                    //cropBmp.Save(output + "1.bmp");

                    ImageConverter converter = new ImageConverter();
                    byte[] bytes;
                    using (var stream = new MemoryStream())
                    {
                        cropBmp.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                        bytes = stream.ToArray();
                    }

                    result = Convert.ToBase64String(bytes);
                }
            }
            File.Delete(OutputPdf);
            File.Delete(InputDoc);
            File.Delete(output + ".jpg");

            return result;
        }
        public static byte[] ConvertToWord(string content, byte[] fileBytes = null)
        {
            SautinSoft.HtmlToRtf h = new SautinSoft.HtmlToRtf();
            h.OpenHtml(content);
            return h.ToDocx(); 
            //return File.ReadAllBytes();
            //using (Doc doc = new Doc())
            //{
            //    ParagraphFrame paragraphFrame = new ParagraphFrame();
            //    TextRunFrame run = new TextRunFrame();
            //    run.Text = content;
            //    doc.DocumentFrame.Adopt(paragraphFrame.Children.AddLast(run));
            //    //doc.SaveAs(outputPath);
            //    string path = "C:\\doObj.doc";
            //    doc.SaveAs(path);
            //    return File.ReadAllBytes(path);
            //}
            //Document document = new Document();
            //DocumentBuilder builder = new DocumentBuilder(document);
            //builder.Font.Name = "Times New Roman";
            //builder.InsertHtml(content);
            //Application word = new Application();
            //Document wordDoc; /*= new Document();*/
            //Object oMissing = System.Reflection.Missing.Value;
            ////wordDoc = word.Documents.Add(ref oMissing, ref oMissing, ref oMissing, ref oMissing);
            //word.Visible = false;
            //var tmpFile = Path.GetTempFileName();
            //content = content ?? "<p>qwe <i>ewq</i></p> абвк <p>Второй абзац</p>";
            //File.WriteAllText(tmpFile, content, Encoding.UTF8);
            ////File.WriteAllBytes(tmpFile, fileBytes);
            //Object filepath = tmpFile;

            //Object confirmconversion = System.Reflection.Missing.Value;
            //Object readOnly = false;
            ////Object saveto = "e:\\doc.docx";
            ////Object oallowsubstitution = System.Reflection.Missing.Value;

            //wordDoc = word.Documents.Open(ref filepath, ref confirmconversion,
            //    ref readOnly, ref oMissing,
            //    ref oMissing, ref oMissing, ref oMissing, ref oMissing,
            //    ref oMissing, ref oMissing, ref oMissing, ref oMissing,
            //    ref oMissing, ref oMissing, ref oMissing, ref oMissing);
            ////object fileFormat = WdSaveFormat.wdFormatDocument;
            //byte[] array;
            //try
            //{
            //    wordDoc.Close();
            //    array = File.ReadAllBytes(tmpFile);
            //}
            //catch (Exception exc)
            //{
            //    array = new byte[1];
            //}



            //File.Delete(tmpFile);

            //return array;
        }
        public static string CropImage(string input)
        {
            string output = "";
            try
            {
                output = Convert.ToBase64String(ConvertImage(input));
            }
            catch (Exception e)
            {
                output = UnpackException(e);
            }
            return output;
        }
        public static string CropImageWithFix(string input)
        {
            string output = "";
            try
            {
                output = Convert.ToBase64String(FinishImage(input));
            }
            catch (Exception e)
            {
                output = UnpackException(e);
            }
            return output;
        }
        public static string CropImage(string input, int Width)
        {
            string output = "";
            try
            {
                //byte[] ImgByte = ConvertImage(input);
                //ImageHelper.DoExamp(ImgByte, Width);
                //output = Convert.ToBase64String(ImgByte);


                byte[] array = Convert.FromBase64String(input);
                array = ImageHelper.DoExamp(array, Width);
                output = Convert.ToBase64String(ConvertImage(Convert.ToBase64String(array)));
            }
            catch (Exception e)
            {
                output = UnpackException(e);
            }
            return output;
        }
        private static string UnpackException(Exception exc)
        {
            string result = exc.Message + "\n";
            if (exc.InnerException != null)
            {
                result += UnpackException(exc.InnerException);
            }
            return result;
        }
        private static byte[] FinishImage(string input)
        {
            byte[] src = Convert.FromBase64String(input);
            using (var stream = new MemoryStream())
            {
                stream.Write(src, 0, src.Length);

                using (Bitmap bmp = new Bitmap(stream))
                {
                    LockBitmap bmp1 = new LockBitmap(bmp);
                    bmp1.LockBits();
                    int left = 0, top = -1, bottom = 0, right = 0;
                    int step = bmp1.Depth == 32 ? 4 : bmp1.Depth == 24 ? 3 : 1;
                    for (int i = 0; i < bmp.Width; i++)
                    {
                        for (int j = 0; j < bmp.Height; j++)
                        {
                            if (bmp1.GetPixel(i, j).R < 250)
                            {
                                top = ((top == -1 || top > j) && j != 0) ? j : top;
                                left = (left == 0 || left > i) ? i : left;
                                bottom = (bottom == 0 || bottom < j) ? j : bottom;
                                right = (right == 0 || right < i) ? i : right;
                            }
                        }
                    }
                    right = right > 2100 ? right : 2100;
                    // right = 2175;
                    // right = 2400;
                    //Костыль
                    //top = 56;
                    Bitmap cropBmp;
                    try
                    {
                        cropBmp = bmp.Clone(new System.Drawing.Rectangle(left, top, right - left, bottom - top), bmp.PixelFormat);
                    }
                    catch
                    {
                        int width = right - left > bmp.Width ? bmp.Width : right - left;
                        cropBmp = bmp.Clone(new System.Drawing.Rectangle(left, top, width - left, bottom - top), bmp.PixelFormat);
                    }
                    byte[] bytes;
                    using (var stream1 = new MemoryStream())
                    {
                        cropBmp.Save(stream1, System.Drawing.Imaging.ImageFormat.Png);
                        bytes = stream1.ToArray();
                    }
                    return bytes;
                }
            }
        }
        private static byte[] ConvertImage(string input)
        {
            byte[] src = Convert.FromBase64String(input);
            using (var stream = new MemoryStream())
            {
                stream.Write(src, 0, src.Length);

                using (Bitmap bmp = new Bitmap(stream))
                {
                    LockBitmap bmp1 = new LockBitmap(bmp);
                    bmp1.LockBits();
                    int left = 0, top = -1, bottom = 0, right = 0;
                    int step = bmp1.Depth == 32 ? 4 : bmp1.Depth == 24 ? 3 : 1;
                    for (int i = 0; i < bmp.Width; i++)
                    {
                        for (int j = 0; j < bmp.Height; j++)
                        {
                            if (bmp1.GetPixel(i, j).R < 250)
                            {
                                top = ((top == -1 || top > j) && j != 0) ? j : top;
                                left = (left == 0 || left > i) ? i : left;
                                bottom = (bottom == 0 || bottom < j) ? j : bottom;
                                right = (right == 0 || right < i) ? i : right;
                            }
                        }
                    }
                    //Костыль
                    //top = 56;
                    Bitmap cropBmp = bmp.Clone(new System.Drawing.Rectangle(left, top, right - left, bottom - top), bmp.PixelFormat);

                    byte[] bytes;
                    using (var stream1 = new MemoryStream())
                    {
                        cropBmp.Save(stream1, System.Drawing.Imaging.ImageFormat.Png);
                        bytes = stream1.ToArray();
                    }
                    return bytes;
                }
            }
        }
        public static byte[] CropImageByte(string input)
        {
            return ConvertImage(input);
        }
    }
    public class LockBitmap
    {
        Bitmap source = null;
        IntPtr Iptr = IntPtr.Zero;
        BitmapData bitmapData = null;

        public byte[] Pixels { get; set; }
        public int Depth { get; private set; }
        public int Width { get; private set; }
        public int Height { get; private set; }

        public LockBitmap(Bitmap source)
        {
            this.source = source;
        }

        /// <summary>
        /// Lock bitmap data
        /// </summary>
        public void LockBits()
        {
            try
            {
                // Get width and height of bitmap
                Width = source.Width;
                Height = source.Height;

                // get total locked pixels count
                int PixelCount = Width * Height;

                // Create rectangle to lock
                System.Drawing.Rectangle rect = new System.Drawing.Rectangle(0, 0, Width, Height);

                // get source bitmap pixel format size
                Depth = System.Drawing.Bitmap.GetPixelFormatSize(source.PixelFormat);

                // Check if bpp (Bits Per Pixel) is 8, 24, or 32
                if (Depth != 8 && Depth != 24 && Depth != 32)
                {
                    throw new ArgumentException("Only 8, 24 and 32 bpp images are supported.");
                }

                // Lock bitmap and return bitmap data
                bitmapData = source.LockBits(rect, ImageLockMode.ReadWrite,
                                             source.PixelFormat);

                // create byte array to copy pixel values
                int step = Depth / 8;
                Pixels = new byte[PixelCount * step];
                Iptr = bitmapData.Scan0;

                // Copy data from pointer to array
                Marshal.Copy(Iptr, Pixels, 0, Pixels.Length);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Unlock bitmap data
        /// </summary>
        public void UnlockBits()
        {
            try
            {
                // Copy data from byte array to pointer
                Marshal.Copy(Pixels, 0, Iptr, Pixels.Length);

                // Unlock bitmap data
                source.UnlockBits(bitmapData);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Get the color of the specified pixel
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <returns></returns>
        public Color GetPixel(int x, int y)
        {
            Color clr = Color.Empty;

            // Get color components count
            int cCount = Depth / 8;

            // Get start index of the specified pixel
            int i = ((y * Width) + x) * cCount;

            if (i > Pixels.Length - cCount)
                throw new IndexOutOfRangeException();

            if (Depth == 32) // For 32 bpp get Red, Green, Blue and Alpha
            {
                byte b = Pixels[i];
                byte g = Pixels[i + 1];
                byte r = Pixels[i + 2];
                byte a = Pixels[i + 3]; // a
                clr = Color.FromArgb(a, r, g, b);
            }
            if (Depth == 24) // For 24 bpp get Red, Green and Blue
            {
                byte b = Pixels[i];
                byte g = Pixels[i + 1];
                byte r = Pixels[i + 2];
                clr = Color.FromArgb(r, g, b);
            }
            if (Depth == 8)
            // For 8 bpp get color value (Red, Green and Blue values are the same)
            {
                byte c = Pixels[i];
                clr = Color.FromArgb(c, c, c);
            }
            return clr;
        }

        /// <summary>
        /// Set the color of the specified pixel
        /// </summary>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="color"></param>
        public void SetPixel(int x, int y, Color color)
        {
            // Get color components count
            int cCount = Depth / 8;

            // Get start index of the specified pixel
            int i = ((y * Width) + x) * cCount;

            if (Depth == 32) // For 32 bpp set Red, Green, Blue and Alpha
            {
                Pixels[i] = color.B;
                Pixels[i + 1] = color.G;
                Pixels[i + 2] = color.R;
                Pixels[i + 3] = color.A;
            }
            if (Depth == 24) // For 24 bpp set Red, Green and Blue
            {
                Pixels[i] = color.B;
                Pixels[i + 1] = color.G;
                Pixels[i + 2] = color.R;
            }
            if (Depth == 8)
            // For 8 bpp set color value (Red, Green and Blue values are the same)
            {
                Pixels[i] = color.B;
            }
        }
    }
}
