using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace WebApplication1.Models
{
    public class AuditoryManager:Manager
    {
        public AuditoryManager(Concrete concrete) : base(concrete) { }
        public IEnumerable<Auditory> GetAuditoryList(string userUID, string localization = "")
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<Auditory>(
                    sql: "[dbo].[Administrator_AuditoriumsGet]",
                    new { userUID },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public Auditory GetAuditoryById(string userUID, int auditoriumId)
        {
            Auditory aud = new Auditory();
            using (var cnt = Concrete.OpenConnection())
            {
                using (var multi = cnt.QueryMultiple(sql: "[dbo].[Administrator_AuditoriumGet]", new { userUID, auditoriumId}, commandType: CommandType.StoredProcedure)) {
                    aud = multi.ReadFirst<Auditory>();
                    aud.ComputerList = multi.Read<TestComputer>();
                }
            }
            return aud;
        }
        public void UpdatePlaceConfig(int placeId, Guid userUID, string placeConfig)
        {
            using (var cnt = Concrete.OpenConnection())
            {
                cnt.Execute(sql: "Administrator_PlaceProfilePlaceConfigUpdate", new { placeId, userUID, placeConfig }, commandType: CommandType.StoredProcedure);
            }
        }
    }
}