﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.WebSockets;
using WebApp.Models;
using WebApp.Models.Common;

namespace WebApp
{
    /// <summary>
    /// Сводное описание для StreamHandler
    /// </summary>
    public class StreamHandler : IHttpHandler
    {

        private static Dictionary<int, List<WebSocket>> Clients = new Dictionary<int, List<WebSocket>>();
        private static readonly ReaderWriterLockSlim Locker = new ReaderWriterLockSlim();
        public void ProcessRequest(HttpContext context)
        {
            if (context.IsWebSocketRequest)
                context.AcceptWebSocketRequest(WebSocketRequest);
        }
        private async Task WebSocketRequest(AspNetWebSocketContext context)
        {

            // Получаем сокет клиента из контекста запроса
            var socket = context.WebSocket;
            try
            {
                // Слушаем его
                while (true)
                {
                    int bufferSize = 1000;
                    var mainbuffer = new byte[bufferSize];
                    var offset = 0;
                    var free = mainbuffer.Length;
                    while (true)
                    {
                        var result1 = await socket.ReceiveAsync(new ArraySegment<byte>(mainbuffer, offset, free), CancellationToken.None);
                        offset += result1.Count;
                        free -= result1.Count;
                        if (result1.EndOfMessage) break;

                        if (free == 0)
                        {
                            // No free space
                            // Resize the outgoing buffer
                            var newSize = mainbuffer.Length + bufferSize;

                            var newBuffer = new byte[newSize];
                            Array.Copy(mainbuffer, 0, newBuffer, 0, offset);
                            mainbuffer = newBuffer;
                            free = mainbuffer.Length - offset;
                        }
                    }

                    // var buffer = new ArraySegment<byte>(new byte[1024]);

                    // Ожидаем данные от него
                    // var result = await socket.ReceiveAsync(buffer, CancellationToken.None);

                    Offer jsonparsed = new Offer();
                    try
                    {

                        string cathing = System.Text.Encoding.UTF8.GetString(mainbuffer);
                        //string cathing = System.Text.Encoding.UTF8.GetString(buffer.Array);
                        int nStrtP = cathing.IndexOf("\0");
                        if (nStrtP != -1) //вхождение нулевого символ найденj
                        {
                            cathing = cathing.Substring(0, nStrtP); //выбираем ограниченный символами текст                
                        }
                        jsonparsed = Json.Decode<Offer>(cathing);
                        if (jsonparsed.ForReset)
                        {
                            foreach (var client in Clients)
                            {
                                foreach (var item in client.Value)
                                {
                                    await item.SendAsync(new ArraySegment<byte>(System.Text.Encoding.UTF8.GetBytes("{reloadRequest: true, IsSender: false}")), WebSocketMessageType.Text, true, CancellationToken.None);
                                    await item.CloseAsync(WebSocketCloseStatus.InternalServerError, "Плановый сброс", CancellationToken.None);
                                    item.Dispose();
                                }
                            }
                            Clients = new Dictionary<int, List<WebSocket>>();
                            return;
                        }
                        if (jsonparsed.ForCreate)
                        {
                            if (!Clients.ContainsKey(jsonparsed.TestingProfileId)) Clients.Add(jsonparsed.TestingProfileId, new List<WebSocket>() { socket });
                            else
                            {
                                List<WebSocket> foundedClient = Clients.Where(a => a.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                                if (!foundedClient.Contains(socket))
                                {
                                    foundedClient.Add(socket);
                                }
                            }
                        }
                        else
                        {

                            List<WebSocket> disposedClients = new List<WebSocket>();
                            //Передаём сообщение всем клиентам
                            foreach (var client in Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value)
                            {

                                // WebSocket client = client1;

                                try
                                {
                                    if (client.State == WebSocketState.Open)
                                    {
                                        await client.SendAsync(new ArraySegment<byte>(mainbuffer), WebSocketMessageType.Text, true, CancellationToken.None);
                                    }
                                }

                                catch (ObjectDisposedException)
                                {
                                    Locker.EnterWriteLock();
                                    try
                                    {
                                        //Clients.Remove
                                        //List<WebSocket> cls = Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                                        //cls.Remove(client);
                                        disposedClients.Add(client);
                                        //Clients.Remove
                                        // Clients.Remove(Clients.Where(a => a.Value == client).FirstOrDefault().Key);
                                        //i--;
                                    }
                                    finally
                                    {
                                        Locker.ExitWriteLock();
                                    }
                                }
                            }
                            var count = disposedClients.Count;
                            for (int i = count; i >= 0; i--)
                            {
                                List<WebSocket> cls = Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                                cls.Remove(disposedClients[i]);
                            }
                        }
                    }
                    catch (Exception e)
                    {

                    }
                }
            }
            catch
            {
                socket.Dispose();
            }
        }
        public bool IsReusable
        {
            get
            {
                return true;
            }
        }
    }
}