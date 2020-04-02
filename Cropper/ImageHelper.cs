using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Text;

namespace Cropper
{
    public static class ImageHelper
    {

        public static byte[] DoExamp(byte[] content, int maxWidth)
        {
            using (var input = new MemoryStream(content))
            {
                MemoryStream output = new MemoryStream();
                int maxHeight = 0;
                bool useCalcSize = false;
                bool resultJpeg = true;

                if ((maxWidth == 0 && maxHeight == 0) || maxWidth < 0 || maxHeight < 0) throw new ArgumentOutOfRangeException();

                if ((maxWidth == 0) != (maxHeight == 0))
                {
                    if (maxWidth == 0) maxWidth = int.MaxValue;
                    else maxHeight = int.MaxValue;
                }

                Image oImage = null;
                using (var iImage = new Bitmap(input))
                {
                    maxWidth = maxWidth > iImage.Width ? iImage.Width : maxWidth;
                    // если одно из значений не задано выставить его в значение изображения
                    if (maxWidth == 0) maxWidth = iImage.Width;
                    else if (maxHeight == 0) maxHeight = iImage.Height;

                    // вычислить коэффициенты
                    var wFactor = iImage.Width / (float)maxWidth;
                    var hFactor = iImage.Height / (float)maxHeight;

                    var factor = wFactor > hFactor ? wFactor : hFactor;

                    // вычислить координаты и размер
                    var rect1 = new RectangleF { Width = iImage.Width / factor, Height = iImage.Height / factor };



                    // перерисовать изображение с мах. настройками качества
                    oImage = new Bitmap(maxWidth, (int)(iImage.Height / factor));
                    using (var g = Graphics.FromImage(oImage))
                    {
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.CompositingQuality = CompositingQuality.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.DrawImage(iImage, rect1);
                    }
                }

                // вернут выходной поток
                using (oImage)
                {
                    oImage.Save(output, resultJpeg ? ImageFormat.Jpeg : ImageFormat.Png);
                    output.Seek(0, SeekOrigin.Begin);
                }
                return output.ToArray();
            }
        }

        #region Core

        //private static MemoryStream Resize(Stream stream, int maxWidth, int maxHeight, Func<float, float, int, int, int, int, RectangleF> calculator, bool useCalcSize = false, bool resultJpeg = true)
        //{
        //    if (stream == null) throw new ArgumentNullException("stream");
        //    if (!stream.CanRead) throw new NotSupportedException("stream");
        //    if ((maxWidth == 0 && maxHeight == 0) || maxWidth < 0 || maxHeight < 0) throw new ArgumentOutOfRangeException();

        //    Image oImage = null;
        //    using (var iImage = new Bitmap(stream))
        //    {
        //        // если одно из значений не задано выставить его в значение изображения
        //        if (maxWidth == 0) maxWidth = iImage.Width;
        //        else if (maxHeight == 0) maxHeight = iImage.Height;

        //        // вычислить коэффициенты
        //        var wFactor = iImage.Width / (float)maxWidth;
        //        var hFactor = iImage.Height / (float)maxHeight;

        //        // вычислить координаты и размер
        //        var rect = calculator(wFactor, hFactor, iImage.Width, iImage.Height, maxWidth, maxHeight);


        //        // перерисовать изображение с мах. настройками качества
        //        oImage = new Bitmap(useCalcSize ? (int)Math.Round(rect.Width) : maxWidth, useCalcSize ? (int)Math.Round(rect.Height) : maxHeight);
        //        using (var g = Graphics.FromImage(oImage))
        //        {
        //            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        //            g.SmoothingMode = SmoothingMode.HighQuality;
        //            g.CompositingQuality = CompositingQuality.HighQuality;
        //            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
        //            g.DrawImage(iImage, rect);
        //        }
        //    }

        //    // вернут выходной поток
        //    using (oImage)
        //    {
        //        var ms = new MemoryStream();
        //        oImage.Save(ms, resultJpeg ? ImageFormat.Jpeg : ImageFormat.Png);
        //        ms.Seek(0, SeekOrigin.Begin);
        //        return ms;
        //    }
        //}

        //#endregion


        //#region Fit

        ///// <summary>
        ///// Вписать изображение в заданные границы (пропорционально уменьшить/увеличить если надо), хотя бы одна из границ должна быть задана
        ///// </summary>
        //public static MemoryStream Fit(Stream stream, int maxWidth = 0, int maxHeight = 0, bool resultJpeg = true)
        //{
        //    // если только одно из значений не установлено, задать ему мах. значение
        //    if ((maxWidth == 0) != (maxHeight == 0))
        //    {
        //        if (maxWidth == 0) maxWidth = int.MaxValue;
        //        else maxHeight = int.MaxValue;
        //    }

        //    return Resize(stream, maxWidth, maxHeight, (wFactor, hFactor, width, height, mWidth, mHeight) =>
        //    {
        //        var factor = wFactor > hFactor ? wFactor : hFactor;
        //        return new RectangleF { Width = width / factor, Height = height / factor };
        //    }, true, resultJpeg);
        //}

        ///// <summary>
        ///// Вписать изображение в заданные границы (пропорционально уменьшить/увеличить если надо), хотя бы одна из границ должна быть задана
        ///// </summary>
        //public static byte[] Fit(byte[] content, int maxWidth = 0, int maxHeight = 0, bool resultJpeg = true)
        //{
        //    if (content == null || content.Length == 0) throw new ArgumentNullException("content");

        //    using (var input = new MemoryStream(content))
        //    {
        //        using (var output = Fit(input, maxWidth, maxHeight, resultJpeg))
        //        {
        //            return output.ToArray();
        //        }
        //    }
        //}

        //#endregion


        //#region Center

        ///// <summary>
        ///// Отцентрировать изображение относительно окна (пропорционально уменьшить/увеличить если надо)
        ///// </summary>
        //public static MemoryStream Center(Stream stream, int viewportWidth, int viewportHeight, bool resultJpeg = true)
        //{
        //    return Resize(stream, viewportWidth, viewportHeight, (wFactor, hFactor, width, height, mWidth, mHeight) =>
        //    {
        //        var factor = wFactor < hFactor ? wFactor : hFactor;
        //        var w = width / factor;
        //        var h = height / factor;
        //        return new RectangleF { X = (mWidth - w) / 2, Y = (mHeight - h) / 2, Width = w, Height = h };
        //    }, false, resultJpeg);
        //}

        ///// <summary>
        ///// Отцентрировать изображение относительно окна (пропорционально уменьшить/увеличить если надо)
        ///// </summary>
        //public static byte[] Center(byte[] content, int viewportWidth, int viewportHeight, bool resultJpeg = true)
        //{
        //    if (content == null || content.Length == 0) throw new ArgumentNullException("content");

        //    using (var input = new MemoryStream(content))
        //    {
        //        using (var output = Center(input, viewportWidth, viewportHeight, resultJpeg))
        //        {
        //            return output.ToArray();
        //        }
        //    }
        //}

        #endregion
    }
}
