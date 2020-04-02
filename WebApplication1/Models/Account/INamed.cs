using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApplication1.Models.Account
{
    public interface INamed
    {
        /// <summary>
      /// Имя
      /// </summary>
        string Firstname { get; set; }

        /// <summary>
        /// Отчество
        /// </summary>
        string Lastname { get; set; }

        /// <summary>
        /// Фамилия
        /// </summary>
        string Surname { get; set; }
    }
}
