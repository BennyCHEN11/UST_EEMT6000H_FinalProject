import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'
import axios from 'axios';

const Home = ({ marketplace, nft }) => {
  const [nftItems, setNftItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNFTData = async () => {
      try {
          // 1. 首先从市场合约获取所有商品
          const itemCount = await marketplace.itemCount();
          const items = [];

          for(let i = 1; i <= itemCount; i++) {
              const item = await marketplace.items(i);
              if(!item.sold) {
                  // 2. 获取NFT的URI (这个URI包含了IPFS的CID)
                  const tokenURI = await nft.tokenURI(item.tokenId);
                  // 3. 从IPFS获取元数据
                  const metadataUrl = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                  
                  const metadata = await axios.get(metadataUrl);
                  
                  // 4. 获取总价（价格+费用）
                  const totalPrice = await marketplace.getTotalPrice(item.itemId);

                  // 5. 组合所有数据
                  items.push({
                      totalPrice,
                      itemId: item.itemId.toString(),
                      seller: item.seller,
                      name: metadata.data.name,
                      description: metadata.data.description,
                      image: metadata.data.image.replace("ipfs://", "https://ipfs.io/ipfs/"),
                      tokenId: item.tokenId.toString()
                  });
              }
          }
          setNftItems(items);
          setLoading(false);
      } catch (error) {
          console.error("Error fetching NFT data:", error);
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchNFTData();
  }, []);

  // 渲染加载状态
  if (loading) return (
      <div>
          <p>Loading...</p>
      </div>
  );

  // 渲染NFT列表
  return (
      <div className="container">
          <div className="row">
              {nftItems.map((item, idx) => (
                  <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div className="card">
                          <img 
                              src={item.image} 
                              className="card-img-top" 
                              alt={item.name}
                              onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "fallback-image-url.jpg"
                              }}
                          />
                          <div className="card-body">
                              <h5 className="card-title">{item.name}</h5>
                              <p className="card-text">Description: {item.description}</p>
                              <p className="card-text">Price: {ethers.utils.formatEther(item.totalPrice)} ETH</p>
                              <button 
                                  className="btn btn-primary"
                                  onClick={() => {
                                      // 购买NFT的函数
                                      marketplace.purchaseItem(item.itemId, {
                                          value: item.totalPrice
                                      })
                                  }}
                              >
                                  Buy NFT
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
};

export default Home;