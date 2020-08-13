using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

namespace Cropper
{
    public class Cropper
    {
        public static string CropImage(string input)
        {
            string output = "";
            try
            {
                output = Convert.ToBase64String(ConvertImage(input));
            }
            catch(Exception e)
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
            catch(Exception e)
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
            if(exc.InnerException != null)
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
                    right = right > 2175 ? right : 2175;
                   // right = 2175;
                  // right = 2400;
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
                Rectangle rect = new Rectangle(0, 0, Width, Height);

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
