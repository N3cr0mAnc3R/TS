using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using Dapper;

namespace WebApplication1.Models
{
    public class TestManager : Manager
    {
        public TestManager(Concrete concrete) : base(concrete) { }
        public IEnumerable<string> GetImages(int Id)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<string>(
                    sql: "dbo.Qwestion_Get",
                    new { id = Id },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public IEnumerable<Test1> GetImages1(int Id)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<Test1>(
                    sql: "dbo.Qwestion_GetBlob",
                    new { id = Id },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
    public class Test1
    {
        public int ID { get; set; }
        public byte[] qwestion { get; set; }
    }
}